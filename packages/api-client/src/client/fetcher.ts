let baseUrl = 'http://localhost:3001';

export function setBaseUrl(url: string) {
  baseUrl = url;
}

export function getBaseUrl(): string {
  return baseUrl;
}

/**
 * Wire-format error body (post-F1 backend):
 *   { statusCode, code, message, severity, suggestedAction?, params?, fields? }
 *
 * No `success: false` envelope — the HTTP status carries "error". Frontend
 * dispatches by `severity` (toast/modal/banner/inline/silent) without a
 * per-code switch.
 */
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

export async function customFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
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

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export default customFetch;
