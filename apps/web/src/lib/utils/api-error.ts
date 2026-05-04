/**
 * @deprecated Use `ApiError` from `api-client` and let `customFetch`
 * throw it. Manual `parseApiError(response, fallback)` callsites only
 * exist on legacy fetch() handlers; F3 migrates them to the SDK.
 *
 * This file is kept as a thin shim so the legacy callers continue to
 * compile during the cleanup window.
 */

import { type ApiError, isApiError } from 'api-client';

export type ApiErrorAction =
  | { kind: 'redirect'; to: string }
  | { kind: 'retry' }
  | { kind: 'highlight-fields' }
  | { kind: 'toast' };

export interface ParsedApiError {
  message: string;
  code?: string;
  action: ApiErrorAction;
  details?: Record<string, unknown>;
}

function actionFromSeverity(
  severity: ApiError['severity'] | undefined,
  status?: number,
): ApiErrorAction {
  if (severity === 'modal' && status === 401) {
    return { kind: 'redirect', to: '/identity/sign-in' };
  }
  if (severity === 'inline') return { kind: 'highlight-fields' };
  if (severity === 'modal' || severity === 'banner') return { kind: 'toast' };
  if (status && status >= 500) return { kind: 'retry' };
  return { kind: 'toast' };
}

export async function parseApiError(
  res: Response,
  fallbackMessage: string,
): Promise<ParsedApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { message: fallbackMessage, action: actionFromSeverity(undefined, res.status) };
  }
  return parseApiErrorMutationRequest(body, fallbackMessage, res.status);
}

export function parseApiErrorMutationRequest(
  body: unknown,
  fallbackMessage: string,
  status?: number,
): ParsedApiError {
  if (isApiError(body)) {
    return {
      message: body.message ?? fallbackMessage,
      code: body.code,
      action: actionFromSeverity(body.severity, body.statusCode ?? status),
      details: body.params,
    };
  }
  // F1 wire format: `{statusCode, code, message, severity, suggestedAction?, params?, fields?}`.
  if (body && typeof body === 'object') {
    const e = body as Record<string, unknown>;
    return {
      message: typeof e.message === 'string' ? e.message : fallbackMessage,
      code: typeof e.code === 'string' ? e.code : undefined,
      action: actionFromSeverity(e.severity as ApiError['severity'] | undefined, status),
      details:
        e.params && typeof e.params === 'object'
          ? (e.params as Record<string, unknown>)
          : undefined,
    };
  }
  return { message: fallbackMessage, action: actionFromSeverity(undefined, status) };
}
