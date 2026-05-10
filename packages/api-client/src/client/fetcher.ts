// Kubb mutator. Contract Kubb expects:
//   default export: client<TData, TError, TVariables>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>>
//   named exports:  RequestConfig, ResponseConfig, ResponseErrorConfig
//
// `dataReturnType: 'data'` in kubb.config.ts makes the generated wrappers
// return `res.data` directly, so callsites never see the {data, status}
// envelope — they get the bare body. This file stays internal: the app
// barrel re-exports only `ApiError`, `isApiError`, `getBaseUrl`, `setBaseUrl`.

let baseUrl = 'http://localhost:3001';

export function setBaseUrl(url: string) {
  baseUrl = url;
}

export function getBaseUrl(): string {
  return baseUrl;
}

// Locale resolution for `Accept-Language`. Without this every request
// hits the backend's i18n fallback (`en` per CLAUDE.md Q8) regardless of
// the user's choice. The SDK is package-level so it can't import from
// `apps/web`; we read the `locale` cookie that
// `apps/web/src/lib/state/locale.svelte.ts` writes whenever the user picks
// a locale (or initial detection runs). The same file accepts cookie /
// localStorage / `navigator.language` and writes the canonical value
// back, so this lookup is the single point of truth on the wire.
const SUPPORTED_LOCALES = ['pt-BR', 'en'] as const;

function resolveAcceptLanguage(): string {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]);
      if ((SUPPORTED_LOCALES as readonly string[]).includes(decoded)) return decoded;
    }
  }
  if (typeof navigator !== 'undefined') {
    const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of tags) {
      if (!tag) continue;
      if ((SUPPORTED_LOCALES as readonly string[]).includes(tag)) return tag;
      const base = tag.split('-')[0];
      const match = SUPPORTED_LOCALES.find((l) => l.split('-')[0] === base);
      if (match) return match;
    }
  }
  return 'pt-BR';
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

function buildUrl(config: RequestConfig): string {
  const root = config.baseURL ?? baseUrl;
  const path = config.url ?? '';
  const url = path.startsWith('http') ? path : `${root}${path}`;
  if (!config.params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(config.params)) {
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
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

  const response = await fetch(url, {
    method: config.method ?? 'GET',
    headers: { ...baseHeaders, ...config.headers },
    credentials: 'include',
    signal: config.signal,
    body:
      config.data === undefined
        ? undefined
        : isFormData
          ? (config.data as unknown as FormData)
          : JSON.stringify(config.data),
  });

  if (!response.ok) {
    let error: ApiError;
    try {
      const body = (await response.json()) as Record<string, unknown> | null;
      error = {
        code: String(body?.code ?? 'API_ERROR'),
        message: String(body?.message ?? response.statusText),
        statusCode: typeof body?.statusCode === 'number' ? body.statusCode : response.status,
        severity:
          (body?.severity as ApiError['severity']) ?? (response.status >= 500 ? 'modal' : 'toast'),
        suggestedAction: body?.suggestedAction as ApiError['suggestedAction'],
        params: body?.params as Record<string, unknown> | undefined,
        fields: body?.fields as ApiError['fields'],
      };
    } catch {
      error = {
        code: 'NETWORK_ERROR',
        message: response.statusText,
        statusCode: response.status,
        severity: 'toast',
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
