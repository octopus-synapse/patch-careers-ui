import { type ApiError, isApiError } from 'api-client';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * @deprecated Backend now returns `message` already localized in the
 * negotiated `Accept-Language`. Prefer `err.message` directly. This
 * helper is kept only as a transitional shim — it returns `err.message`
 * when present and falls back to the supplied or generic copy.
 *
 * F3 swap: the new `<ErrorRenderer>` reads `err.severity` from the
 * `ApiError` and dispatches to toast/modal/banner/inline without any
 * code-to-key mapping in the frontend.
 */
export function translateApiError(err: unknown, t: Translate, fallback?: string): string {
  if (isApiError(err) && err.message) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback ?? t('errors.generic');
}

export function apiErrorStatusCode(err: unknown): number | undefined {
  return isApiError(err) ? (err as ApiError).statusCode : undefined;
}
