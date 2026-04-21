let baseUrl = 'http://localhost:3001';

export function setBaseUrl(url: string) {
  baseUrl = url;
}

export function getBaseUrl(): string {
  return baseUrl;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'code' in error && 'statusCode' in error;
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
      // Backend's ApiResponseInterceptor wraps errors as
      //   { success: false, statusCode, message, error: { code, message, details, ... } }
      // Flatten that envelope so consumers always see ApiError at the top
      // level (matches the success-side flattening below).
      const body = (await response.json()) as Record<string, unknown> | null;
      const inner =
        body && typeof body.error === 'object' && body.error !== null
          ? (body.error as Record<string, unknown>)
          : null;
      error = {
        code: String(inner?.code ?? body?.code ?? 'API_ERROR'),
        message: String(inner?.message ?? body?.message ?? response.statusText),
        statusCode: typeof body?.statusCode === 'number' ? body.statusCode : response.status,
        details:
          (inner?.details as Record<string, unknown> | undefined) ??
          (body?.details as Record<string, unknown> | undefined),
      };
    } catch {
      error = { code: 'NETWORK_ERROR', message: response.statusText, statusCode: response.status };
    }
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json();

  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

export default customFetch;
