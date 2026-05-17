// Kubb mutator. Contract Kubb expects:
//   default export: client<TData, TError, TVariables>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>>
//   named exports:  RequestConfig, ResponseConfig, ResponseErrorConfig
//
// `dataReturnType: 'data'` in kubb.config.ts makes the generated wrappers
// return `res.data` directly, so callsites never see the {data, status}
// envelope — they get the bare body. This file stays internal: the app
// barrel re-exports only `ApiError`, `isApiError`, `getBaseUrl`, `setBaseUrl`.

import { getOrCreateController } from './abort-registry';

// Matches the dev backend's published port in
// `profile-services/docker-compose.dev.yml`: host 13001 → container 3001.
// Production callers MUST override via `setBaseUrl()` (the root layout
// does this from `import.meta.env.VITE_API_URL`); this default exists
// only so a Node-side import of the SDK doesn't crash on
// `setBaseUrl()`-not-called.
let baseUrl = 'http://localhost:13001';

export function setBaseUrl(url: string) {
  baseUrl = url;
}

export function getBaseUrl(): string {
  return baseUrl;
}

// Locale resolution for `Accept-Language`. The app injects its source-of-
// truth via `setAcceptLanguageProvider`. We do NOT read `document.cookie`
// from inside the fetcher: doing so was unsafe in SSR (TypeError when no
// document exists) and incorrect on the server even when guarded (the
// browser-side cookie isn't the server's locale, it's the cookie of the
// last user to render on this Node process).
//
// On the client the app wires `() => locale.current`.
// On the server the SvelteKit handle hook wires
// `() => event.locals.locale`, which is resolved per-request from the URL
// param / cookie / Accept-Language header parser.
let acceptLanguageProvider: (() => string | undefined) | null = null;

export function setAcceptLanguageProvider(fn: () => string | undefined): void {
  acceptLanguageProvider = fn;
}

function resolveAcceptLanguage(): string {
  const fromProvider = acceptLanguageProvider?.();
  return fromProvider && fromProvider.length > 0 ? fromProvider : 'pt-BR';
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  severity: 'toast' | 'modal' | 'banner' | 'inline' | 'silent';
  suggestedAction?: { label: string; href?: string; eventName?: string };
  params?: Record<string, unknown>;
  fields?: Array<{
    path: ReadonlyArray<string | number>;
    code: string;
    params?: Record<string, unknown>;
    message: string;
  }>;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'statusCode' in error &&
    'severity' in error
  );
}

export type RequestConfig<TData = unknown> = {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  baseURL?: string;
  params?: Record<string, unknown>;
  data?: TData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type ResponseConfig<TData = unknown> = {
  data: TData;
  status: number;
  statusText: string;
  headers?: Record<string, string>;
};

export type ResponseErrorConfig<TError = unknown> = ApiError & {
  response?: ResponseConfig<TError>;
};

export type Client = <TData, _TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
) => Promise<ResponseConfig<TData>>;

/**
 * P0-#23 — defense against path-traversal in SDK path params.
 *
 * The Kubb-generated `get…Url(value)` helpers interpolate user-controlled
 * values into the path template without encoding:
 *
 *   /api/v1/profiles/${username}
 *
 * A username of `foo/../bar`, `foo?bar=1`, or `foo#frag` previously
 * escaped the per-resource segment and reached completely different
 * endpoints. We can't easily change the generator inline; instead the
 * fetcher walks the path AFTER the API prefix, refuses any segment
 * containing `..` (path traversal), `/` (segment escape) or unsafe
 * URL-meta chars, and percent-encodes anything else that wasn't
 * already encoded.
 *
 * Routes whose path is a literal API surface (no `${...}` interpolation)
 * pass through unchanged.
 */
const API_PREFIX_RE = /^\/api\/v\d+\//;

function sanitizePath(path: string): string {
  // Detach query/hash so we only normalise the path part. Generated SDK
  // doesn't embed `?`/`#` from user input, but be defensive in case a
  // future endpoint does.
  const qIdx = path.indexOf('?');
  const head = qIdx >= 0 ? path.slice(0, qIdx) : path;
  const tail = qIdx >= 0 ? path.slice(qIdx) : '';

  if (!API_PREFIX_RE.test(head)) return head + tail;

  const segments = head.split('/');
  // segments[0] is '' (leading slash), [1]='api', [2]='v1', [3..] = resource.
  const out: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s: string = segments[i] ?? '';
    if (i < 3) {
      // Prefix segments (`''`, `'api'`, `'v1'`) — leave verbatim.
      out.push(s);
      continue;
    }
    if (s === '' || s === '.') {
      // Trailing slash or `.` — allow but normalise.
      out.push(s);
      continue;
    }
    if (s === '..' || s.includes('..')) {
      throw new Error(`SDK: refused path traversal segment: ${JSON.stringify(s)}`);
    }
    // Re-encode if the segment contains characters that would change the
    // URL's meaning (`/`, `?`, `#`, `%` when not already a valid %-triplet).
    // `decodeURIComponent` round-trips clean segments and detects double
    // encoding.
    let decoded: string;
    try {
      decoded = decodeURIComponent(s);
    } catch {
      throw new Error(`SDK: malformed percent-encoding in segment: ${JSON.stringify(s)}`);
    }
    out.push(encodeURIComponent(decoded));
  }
  return out.join('/') + tail;
}

function buildUrl(config: RequestConfig): string {
  const root = config.baseURL ?? baseUrl;
  const rawPath = config.url ?? '';
  const safePath = rawPath.startsWith('http') ? rawPath : sanitizePath(rawPath);
  const url = safePath.startsWith('http') ? safePath : `${root}${safePath}`;
  if (!config.params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(config.params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      // Repeated query params (`?status=a&status=b`) instead of a CSV that
      // most backends would parse as a single string. Matches OpenAPI
      // `style: form, explode: true` (the SDK's default).
      for (const item of v) qs.append(k, String(item));
    } else {
      qs.append(k, String(v));
    }
  }
  const tail = qs.toString();
  return tail ? `${url}?${tail}` : url;
}

export default async function client<TData, _TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> {
  const url = buildUrl(config);

  // FormData carries its own multipart Content-Type with boundary — don't
  // override and don't JSON.stringify. Lets multipart endpoints (image
  // upload, PDF import) flow through the SDK without a fetch escape hatch.
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  const acceptLanguage = resolveAcceptLanguage();
  const baseHeaders: Record<string, string> = isFormData
    ? { Accept: 'application/json', 'Accept-Language': acceptLanguage }
    : {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Language': acceptLanguage,
      };

  // Default AbortController for callers that didn't pass one. Without
  // this, imperative SDK calls (analytics, multipart uploads) had no
  // way to be cancelled — closing a tab or kicking off a retry stacked
  // pending fetches that all came back to a stale handler.
  const defaultCtrl = getOrCreateController(config as RequestConfig<unknown>);
  const signal = config.signal ?? defaultCtrl?.signal;

  const response = await fetch(url, {
    method: config.method ?? 'GET',
    headers: { ...baseHeaders, ...config.headers },
    credentials: 'include',
    signal,
    body:
      config.data === undefined
        ? undefined
        : isFormData
          ? (config.data as unknown as FormData)
          : JSON.stringify(config.data),
  });

  if (!response.ok) {
    const status = response.status;
    let error: ApiError;
    try {
      const body = (await response.json()) as Record<string, unknown> | null;
      error = {
        code: String(body?.code ?? 'API_ERROR'),
        message: String(body?.message ?? response.statusText),
        statusCode: typeof body?.statusCode === 'number' ? body.statusCode : status,
        severity: (body?.severity as ApiError['severity']) ?? (status >= 500 ? 'modal' : 'toast'),
        suggestedAction: body?.suggestedAction as ApiError['suggestedAction'],
        params: body?.params as Record<string, unknown> | undefined,
        fields: body?.fields as ApiError['fields'],
      };
    } catch {
      // Body wasn't valid JSON; status code is the authoritative routing
      // signal (404 vs 401 vs 500) and must survive the parse failure.
      error = {
        code: 'PARSE_ERROR',
        message: 'Failed to parse error response',
        statusCode: status,
        severity: status >= 500 ? 'modal' : 'toast',
      };
    }
    throw error;
  }

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  if (response.status === 204) {
    return {
      data: undefined as TData,
      status: response.status,
      statusText: response.statusText,
      headers,
    };
  }

  const data = (await response.json()) as TData;
  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers,
  };
}
