/**
 * Shared HTTP client used by Kubb-generated React Query hooks.
 *
 * PR #3 ships a minimal placeholder. The real interceptor stack —
 * Bearer-token injection from `@patch-careers/auth`, 401-triggered
 * refresh queue, Accept-Language header from `@patch-careers/i18n`,
 * exponential retry — lands in PR #5 (the auth client). The signature
 * here matches what `@kubb/plugin-react-query` emits so PR #5 only has
 * to swap the implementation, not the contract.
 */

export interface FetcherConfig {
  readonly method: string;
  readonly url: string;
  readonly params?: Record<string, unknown> | undefined;
  readonly data?: unknown;
  readonly headers?: Record<string, string> | undefined;
  readonly signal?: AbortSignal | undefined;
}

export interface FetcherResponse<TData> {
  readonly data: TData;
  readonly status: number;
  readonly headers: Headers;
}

let baseUrl = "";

export function configureBaseUrl(url: string): void {
  baseUrl = url.replace(/\/$/, "");
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(`${baseUrl}${path}`, baseUrl || "http://localhost");
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.append(key, String(value));
    }
  }
  return baseUrl ? url.toString() : `${path}${url.search}`;
}

export async function fetcher<TData>(config: FetcherConfig): Promise<FetcherResponse<TData>> {
  const url = buildUrl(config.url, config.params);
  const init: RequestInit = {
    method: config.method.toUpperCase(),
    headers: {
      "content-type": "application/json",
      ...(config.headers ?? {}),
    },
    ...(config.signal ? { signal: config.signal } : {}),
  };
  if (config.data !== undefined) {
    init.body = JSON.stringify(config.data);
  }
  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") ?? "";
  const data = (
    contentType.includes("application/json")
      ? await response.json()
      : ((await response.text()) as unknown)
  ) as TData;
  if (!response.ok) {
    throw Object.assign(new Error(`HTTP ${response.status}`), {
      response: { status: response.status, data },
    });
  }
  return { data, status: response.status, headers: response.headers };
}

export default fetcher;
