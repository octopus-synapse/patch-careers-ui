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
      error = await response.json();
    } catch {
      error = { code: 'NETWORK_ERROR', message: response.statusText, statusCode: response.status };
    }
    throw error;
  }

  if (response.status === 204) {
    return { data: undefined, status: 204, headers: response.headers } as T;
  }

  const data = await response.json();
  return { data, status: response.status, headers: response.headers } as T;
}

export default customFetch;
