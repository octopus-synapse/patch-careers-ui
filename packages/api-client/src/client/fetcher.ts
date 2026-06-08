/**
 * Shared HTTP client used by Kubb-generated React Query hooks.
 *
 * Responsibilities:
 *   - Bearer-token injection via a host-supplied `getAuthHeader()` callback
 *     (typically wired up by `@patch-careers/auth.configureApiClient()`).
 *   - 401 -> refresh -> retry interceptor. Concurrent 401s share a single
 *     refresh in-flight via a singleton Promise so we never fire N
 *     refreshes in parallel.
 *   - `Accept-Mode: tokens` injected automatically on native (RN) builds
 *     so the backend returns Bearer tokens instead of session cookies.
 *   - JSON request / response, query-string serialisation of `params`.
 *
 * Signature aligns with `@kubb/plugin-react-query` defaults:
 *   - default export is the request function (`typeof fetch` in generated)
 *   - `RequestConfig<TData>` and `ResponseErrorConfig<TError>` are
 *     imported by every generated hook.
 */

import { isReactNativeRuntime, singleFlight } from "@patch-careers/platform";

export type RequestMethod = "GET" | "PUT" | "PATCH" | "POST" | "DELETE" | "OPTIONS" | "HEAD";

export interface RequestConfig<TData = unknown> {
  method: RequestMethod;
  url: string;
  baseURL?: string;
  params?: Record<string, unknown> | undefined;
  data?: TData | undefined;
  headers?: Record<string, string> | undefined;
  signal?: AbortSignal | undefined;
  responseType?: "json" | "text" | "blob" | "arraybuffer" | "stream";
}

export interface ResponseConfig<TData = unknown> {
  data: TData;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * Error shape thrown by the fetcher on non-2xx responses. Generated
 * hooks type the `data` field with the swagger-declared error schema
 * (e.g. `Login400`), giving callers typed access to backend error
 * codes.
 */
export interface ResponseErrorConfig<TError = unknown> extends Error {
  response?: {
    status: number;
    statusText: string;
    headers: Headers;
    data: TError;
  };
  status?: number;
  config?: RequestConfig;
  code?: string;
}

export class FetcherError<TError = unknown> extends Error implements ResponseErrorConfig<TError> {
  override readonly name = "FetcherError";
  readonly response?: {
    status: number;
    statusText: string;
    headers: Headers;
    data: TError;
  };
  readonly status?: number;
  readonly config?: RequestConfig;

  constructor(
    message: string,
    opts: {
      response?: {
        status: number;
        statusText: string;
        headers: Headers;
        data: TError;
      };
      config?: RequestConfig;
    } = {},
  ) {
    super(message);
    if (opts.response) {
      this.response = opts.response;
      this.status = opts.response.status;
    }
    if (opts.config) this.config = opts.config;
  }
}

/**
 * Provider-supplied callback returning the current `Authorization`
 * header value (e.g. `Bearer <accessToken>`). Returning `null` means
 * "no auth" (anonymous request). The function is awaited every request
 * so callers can rehydrate tokens from secure storage if needed.
 */
export type GetAuthHeader = () => string | null | Promise<string | null>;

/**
 * Provider-supplied refresh callback. Called once when the fetcher
 * observes a 401. On success it must return the new `Authorization`
 * header value (so the in-flight request can be retried). On failure
 * (e.g. refresh token rejected) it must throw — the fetcher will then
 * surface the original 401 to the caller.
 */
export type RefreshAuth = () => Promise<string | null>;

interface RuntimeConfig {
  baseURL: string;
  getAuthHeader: GetAuthHeader | null;
  refreshAuth: RefreshAuth | null;
  defaultHeaders: Record<string, string>;
  isNative: boolean;
  /**
   * Cookie mode (web): send `credentials: 'include'` so the httpOnly
   * session cookie flows, and treat a refresh that returns no Bearer
   * header as a success (the cookie was rolled) so the 401 is retried.
   */
  useCookies: boolean;
}

const runtime: RuntimeConfig = {
  baseURL: "",
  getAuthHeader: null,
  refreshAuth: null,
  defaultHeaders: {},
  isNative: isReactNativeRuntime(),
  useCookies: false,
};

export interface ConfigureApiClientOptions {
  baseURL?: string;
  getAuthHeader?: GetAuthHeader | null;
  refreshAuth?: RefreshAuth | null;
  defaultHeaders?: Record<string, string>;
  /** Force native-mode header injection regardless of platform detection. */
  forceNative?: boolean;
  /** Web cookie mode — attach `credentials: 'include'` to every request. */
  useCookies?: boolean;
}

/**
 * One-time wiring done by the host app (typically inside
 * `@patch-careers/auth.bootstrap()`). Subsequent calls merge — pass
 * explicit `null` to clear a previously registered callback.
 */
export function configureApiClient(options: ConfigureApiClientOptions): void {
  if (options.baseURL !== undefined) {
    runtime.baseURL = options.baseURL.replace(/\/+$/, "");
  }
  if (options.getAuthHeader !== undefined) {
    runtime.getAuthHeader = options.getAuthHeader;
  }
  if (options.refreshAuth !== undefined) {
    runtime.refreshAuth = options.refreshAuth;
  }
  if (options.defaultHeaders !== undefined) {
    runtime.defaultHeaders = { ...options.defaultHeaders };
  }
  if (options.forceNative !== undefined) runtime.isNative = options.forceNative;
  if (options.useCookies !== undefined) runtime.useCookies = options.useCookies;
}

/** Test-only escape hatch — wipes all wiring back to defaults. */
export function resetApiClient(): void {
  runtime.baseURL = "";
  runtime.getAuthHeader = null;
  runtime.refreshAuth = null;
  runtime.defaultHeaders = {};
  runtime.isNative = isReactNativeRuntime();
  runtime.useCookies = false;
  __resetRefreshState();
}

export function getApiClientRuntime(): Readonly<RuntimeConfig> {
  return runtime;
}

/** Back-compat alias kept for early callers wired against PR #3 placeholder. */
export function configureBaseUrl(url: string): void {
  configureApiClient({ baseURL: url });
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const isAbsolute = /^https?:\/\//i.test(path);
  const base = isAbsolute ? "" : runtime.baseURL;
  const url = `${base}${path}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        search.append(key, String(item));
      }
      continue;
    }
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
}

const refreshFlight = singleFlight<string | null>();

/**
 * Single-flight refresh: concurrent 401 callers all await the same
 * Promise. After it settles (success OR failure) the slot is cleared so
 * the next 401 can trigger a fresh refresh attempt.
 *
 * Backed by the shared `singleFlight` from `@patch-careers/platform` — the
 * same primitive the auth package's refresh-queue uses.
 */
function runRefreshOnce(): Promise<string | null> {
  const refresh = runtime.refreshAuth;
  if (!refresh) return Promise.resolve(null);
  return refreshFlight.run(() => refresh());
}

/** Test-only helper to reset the in-flight refresh slot between cases. */
export function __resetRefreshState(): void {
  refreshFlight.reset();
}

async function buildInit(config: RequestConfig, authHeader: string | null): Promise<RequestInit> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...runtime.defaultHeaders,
    ...(config.headers ?? {}),
  };

  const hasBody = config.data !== undefined && config.method !== "GET" && config.method !== "HEAD";
  if (hasBody && !("content-type" in headers) && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  if (runtime.isNative && !headers["Accept-Mode"] && !headers["accept-mode"]) {
    headers["Accept-Mode"] = "tokens";
  }

  if (authHeader && !headers.Authorization && !headers.authorization) {
    headers.Authorization = authHeader;
  }

  const init: RequestInit = {
    method: config.method,
    headers,
  };
  // Cookie mode (web): send the httpOnly session cookie cross-origin.
  if (runtime.useCookies) init.credentials = "include";
  if (hasBody) {
    init.body = typeof config.data === "string" ? config.data : JSON.stringify(config.data);
  }
  if (config.signal) init.signal = config.signal;
  return init;
}

async function parseBody<TData>(
  response: Response,
  responseType: RequestConfig["responseType"],
): Promise<TData> {
  if (responseType === "text") return (await response.text()) as TData;
  if (responseType === "blob") return (await response.blob()) as TData;
  if (responseType === "arraybuffer") {
    return (await response.arrayBuffer()) as TData;
  }
  if (response.status === 204) return undefined as TData;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const text = await response.text();
    if (!text) return undefined as TData;
    return JSON.parse(text) as TData;
  }
  const text = await response.text();
  return text as unknown as TData;
}

async function executeOnce(config: RequestConfig, authHeader: string | null): Promise<Response> {
  const url = buildUrl(config.url, config.params);
  const init = await buildInit(config, authHeader);
  return await fetch(url, init);
}

/**
 * Core fetcher consumed by every generated Kubb hook. Type parameters
 * mirror the kubb-generated call sites:
 *   `request<TData, TError, TRequestBody>({ method, url, data, ... })`
 *
 * Auth flow per call:
 *   1. Resolve `Authorization` from `getAuthHeader()`.
 *   2. Send request.
 *   3. On 401, if a `refreshAuth` is registered AND we haven't retried
 *      yet, await the singleton refresh. If it yields a new header,
 *      retry the original request once. If it returns `null` (no auth
 *      context) or throws, surface the original 401.
 *   4. On any non-2xx, throw a `FetcherError` whose `.response.data`
 *      matches the swagger-declared error schema.
 */
export async function fetcher<TData = unknown, _TError = unknown, TRequestBody = unknown>(
  config: RequestConfig<TRequestBody>,
): Promise<ResponseConfig<TData>> {
  const initialAuth = runtime.getAuthHeader ? await runtime.getAuthHeader() : null;
  let response = await executeOnce(config as RequestConfig, initialAuth);

  if (response.status === 401 && runtime.refreshAuth) {
    let refreshed = false;
    let newAuth: string | null = null;
    try {
      newAuth = await runRefreshOnce();
      refreshed = true;
    } catch {
      // Refresh failed (e.g. refresh token / cookie rejected) — keep the 401.
      refreshed = false;
    }
    // Bearer mode retries when a new header came back; cookie mode retries on
    // any successful refresh since the rolled cookie carries the new session.
    if (refreshed && (newAuth || runtime.useCookies)) {
      response = await executeOnce(config as RequestConfig, newAuth);
    }
  }

  const data = await parseBody<TData>(response, config.responseType);

  if (!response.ok) {
    throw new FetcherError<unknown>(`HTTP ${response.status} ${response.statusText}`.trim(), {
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data,
      },
      config: config as RequestConfig,
    });
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

export default fetcher;
