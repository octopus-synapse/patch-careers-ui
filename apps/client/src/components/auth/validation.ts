/**
 * Auth form validation bridge.
 *
 * Connects three sources of truth so we don't reinvent rules:
 *   - Kubb-generated zod schemas (`createAccountRequestSchema`,
 *     `emailSchema`, `passwordSchema`) — derived from the same swagger
 *     the backend validates against, so the regex matches byte-for-byte.
 *   - i18n dictionaries (`auth.validation.*`) — human messages, pt-BR + en.
 *   - `DICTIONARIES.errors[code]` from `@patch-careers/api-client` —
 *     backend error codes already translated by the contracts pipeline.
 *
 * Use `validateSignup` / `validateLogin` for pre-submit checks (returns
 * `{ email?, password? }` field-error map or `null` if valid). Use
 * `extractApiErrorMessages` to surface a backend rejection: it walks
 * `fields[]` for inline errors and falls back to the dictionary entry
 * for the top-level `code`.
 */

import { createAccountRequestSchema, emailSchema, passwordSchema } from "@patch-careers/api-client";
import type { Locale, Translator } from "@patch-careers/i18n";
import {
  asRecord,
  type BackendField,
  extractBackendPayload,
  type FetcherErrorLike,
  messageFromUnknown,
  translateBackendCode,
} from "@/lib/errors/backend-error";

export interface AuthFieldErrors {
  email?: string | undefined;
  password?: string | undefined;
}

/** Top-level toast message + field-level inline errors. */
export interface ApiErrorMessages {
  /** Toast title — translated `code` if known, else backend `message`. */
  toast: string;
  /** Per-field inline errors when backend returns `fields[]`. */
  fields: AuthFieldErrors;
}

// ────────────────────────────────────────────────────────────
// zod issue → i18n key mapping
// ────────────────────────────────────────────────────────────

/**
 * The password schema is a single `.regex(...)` so every violation comes
 * out as `invalid_string`. We re-run targeted sub-checks to give a
 * specific reason, mirroring backend rejection precisely.
 */
function passwordIssueKey(value: string): string {
  if (!value) return "auth.validation.passwordRequired";
  if (value.length < 8) return "auth.validation.passwordTooShort";
  if (value.length > 128) return "auth.validation.passwordTooLong";
  if (!/[A-Z]/.test(value)) return "auth.validation.passwordNeedsUppercase";
  if (!/[a-z]/.test(value)) return "auth.validation.passwordNeedsLowercase";
  if (!/[0-9]/.test(value)) return "auth.validation.passwordNeedsDigit";
  if (!/[@$!%*?&]/.test(value)) return "auth.validation.passwordNeedsSymbol";
  return "auth.validation.passwordWeak";
}

function emailIssueKey(value: string): string {
  if (!value) return "auth.validation.emailRequired";
  return "auth.validation.emailInvalid";
}

// ────────────────────────────────────────────────────────────
// Public helpers — pre-submit validation
// ────────────────────────────────────────────────────────────

export interface SignupPayload {
  email: string;
  password: string;
  acceptedTosVersion: string;
  acceptedPrivacyVersion: string;
}

/**
 * Runs the Kubb-generated `createAccountRequestSchema` (zod) against
 * the payload and returns a field-error map. Returns `null` when valid.
 *
 * NOTE: consent is checked separately (UI checkbox) since the schema
 * only validates *that the versions are present*, not that the user
 * actually ticked the box.
 */
export function validateSignup(payload: SignupPayload, t: Translator): AuthFieldErrors | null {
  const result = createAccountRequestSchema.safeParse(payload);
  if (result.success) return null;
  return zodErrorToFields(result.error, payload, t);
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login only validates the email shape and that a password is present —
 * the backend won't apply the signup regex on existing accounts (legacy
 * passwords may not match).
 */
export function validateLogin(payload: LoginPayload, t: Translator): AuthFieldErrors | null {
  const errors: AuthFieldErrors = {};
  if (!payload.email) {
    errors.email = t("auth.validation.emailRequired");
  } else if (!emailSchema.safeParse(payload.email).success) {
    errors.email = t("auth.validation.emailInvalid");
  }
  if (!payload.password) {
    errors.password = t("auth.validation.passwordRequired");
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

/** Standalone check — useful for "is the form valid yet" UI states. */
export function isPasswordStrong(value: string): boolean {
  return passwordSchema.safeParse(value).success;
}

// ────────────────────────────────────────────────────────────
// zod error walking
// ────────────────────────────────────────────────────────────

/** Walks issues from a zod error — uses inferred type to dodge a hard zod dep. */
function zodErrorToFields(
  error: { issues: ReadonlyArray<{ path: ReadonlyArray<string | number> }> },
  payload: { email: string; password: string },
  t: Translator,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === "email" && !errors.email) {
      errors.email = t(emailIssueKey(payload.email));
    } else if (field === "password" && !errors.password) {
      errors.password = t(passwordIssueKey(payload.password));
    }
  }
  return errors;
}

// ────────────────────────────────────────────────────────────
// Backend error → toast + inline messages
// ────────────────────────────────────────────────────────────

function fieldPathName(path: string | string[] | undefined): keyof AuthFieldErrors | null {
  if (Array.isArray(path)) {
    const match = path.find((segment) => segment === "email" || segment === "password");
    return (match ?? null) as keyof AuthFieldErrors | null;
  }
  if (!path) return null;
  const segments = path.split(/[.[\]]+/).filter(Boolean);
  if (segments.includes("email")) return "email";
  if (segments.includes("password")) return "password";
  return null;
}

function fieldFromBackendCode(code: string | undefined): keyof AuthFieldErrors | null {
  switch (code) {
    case "ACCOUNT_ALREADY_EXISTS":
    case "EMAIL_ALREADY_VERIFIED":
    case "EMAIL_IN_USE":
    case "EMAIL_INVALID_FORMAT":
    case "EMAIL_NOT_VERIFIED":
      return "email";
    case "PASSWORD_WEAK":
      return "password";
    default:
      return null;
  }
}

function fieldFallbackMessage(
  field: keyof AuthFieldErrors,
  payload: { email?: string; password?: string } | undefined,
  t: Translator,
): string {
  return field === "email"
    ? t(emailIssueKey(payload?.email ?? ""))
    : t(passwordIssueKey(payload?.password ?? ""));
}

function fieldMessage(
  field: keyof AuthFieldErrors,
  f: BackendField,
  locale: Locale,
  payload: { email?: string; password?: string } | undefined,
  t: Translator,
): string {
  if (f.message) return f.message;
  const fallback = fieldFallbackMessage(field, payload, t);
  return translateBackendCode(f.code, locale, fallback);
}

function fieldArrayFromUnknown(value: unknown): BackendField[] | null {
  if (!Array.isArray(value)) return null;
  const fields: BackendField[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (!record) continue;
    const rawPath = record.path ?? record.field ?? record.property;
    const path =
      typeof rawPath === "string" ||
      (Array.isArray(rawPath) && rawPath.every((segment) => typeof segment === "string"))
        ? rawPath
        : undefined;
    const code = typeof record.code === "string" ? record.code : undefined;
    const message = messageFromUnknown(record.message) ?? messageFromUnknown(record.constraints);
    fields.push({
      ...(path ? { path } : {}),
      ...(code ? { code } : {}),
      ...(message ? { message } : {}),
    });
  }
  return fields.length > 0 ? fields : null;
}

/**
 * Extracts a toast message + inline field errors from a fetcher error.
 *
 * - `fields[]` → mapped to `email` / `password` field errors (translated
 *   via the same i18n keys we use for client-side checks)
 * - top-level `code` → looked up in the contracts dictionary for a
 *   human, localized title
 *
 * The toast and the inline errors are *both* surfaced because a single
 * source isn't always enough: a validation error has per-field detail
 * (inline) AND a summary (toast), while a server error like
 * `ACCOUNT_LOCKED` is toast-only.
 */
export function extractApiErrorMessages(
  err: unknown,
  locale: Locale,
  t: Translator,
  fallbackKey: string,
  payload?: { email?: string; password?: string },
): ApiErrorMessages {
  const data = extractBackendPayload(err);
  const fallback = t(fallbackKey);
  const backendCode = typeof data.code === "string" ? data.code : undefined;

  const fields: AuthFieldErrors = {};
  const backendFields =
    fieldArrayFromUnknown(data.fields) ??
    fieldArrayFromUnknown(data.details) ??
    fieldArrayFromUnknown(data.errors);

  if (backendFields) {
    for (const f of backendFields) {
      const field = fieldPathName(f.path);
      if (field && !fields[field]) {
        fields[field] = fieldMessage(field, f, locale, payload, t);
      }
    }
  }
  const codedField = fieldFromBackendCode(backendCode);
  if (codedField && !fields[codedField]) {
    fields[codedField] = translateBackendCode(
      backendCode,
      locale,
      fieldFallbackMessage(codedField, payload, t),
    );
  }

  const firstFieldError = fields.email ?? fields.password;
  const errorCode =
    typeof (err as FetcherErrorLike)?.code === "string"
      ? (err as FetcherErrorLike).code
      : undefined;
  const backendMessage =
    messageFromUnknown(data.message) ??
    messageFromUnknown(data.details) ??
    messageFromUnknown(data.errors) ??
    (err as FetcherErrorLike)?.message;
  const toast =
    firstFieldError ??
    translateBackendCode(backendCode ?? errorCode, locale, fallback, backendMessage);
  return { toast, fields };
}
