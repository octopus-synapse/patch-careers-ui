import { type ApiError, isApiError } from 'api-client/client';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * Map backend error codes to user-facing messages via i18n. Returns the
 * backend's own message when we don't have a translation — *never* the
 * word "undefined" and never swallowed into a generic "algo deu errado"
 * unless the error is truly unknown (non-ApiError throw, no message).
 *
 * Add new codes here as the backend grows; keeping everything in one
 * place keeps copy consistent across forms.
 */
const CODE_TO_KEY: Record<string, string> = {
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  CONSENT_REQUIRED: 'errors.consentRequired',
  NO_PRIMARY_RESUME: 'errors.noPrimaryResume',
  RATE_LIMITED: 'errors.rateLimited',
  NETWORK_ERROR: 'errors.network',
  VALIDATION_ERROR: 'errors.validation',
  EMAIL_ALREADY_EXISTS: 'errors.emailInUse',
  WEAK_PASSWORD: 'errors.weakPassword',
  CONSENT_VERSION_MISMATCH: 'errors.consentVersionMismatch',
};

const STATUS_TO_KEY: Record<number, string> = {
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  422: 'errors.validation',
  429: 'errors.rateLimited',
};

export function translateApiError(err: unknown, t: Translate, fallback?: string): string {
  const ultimateFallback = fallback ?? t('errors.generic');

  if (isApiError(err)) {
    const byCode = CODE_TO_KEY[err.code];
    if (byCode) {
      const translated = t(byCode);
      if (translated && translated !== byCode) return translated;
    }
    const byStatus = STATUS_TO_KEY[err.statusCode];
    if (byStatus) {
      const translated = t(byStatus);
      if (translated && translated !== byStatus) return translated;
    }
    if (err.message) return err.message;
    return ultimateFallback;
  }

  if (err instanceof Error && err.message) return err.message;
  return ultimateFallback;
}

export function apiErrorStatusCode(err: unknown): number | undefined {
  return isApiError(err) ? (err as ApiError).statusCode : undefined;
}
