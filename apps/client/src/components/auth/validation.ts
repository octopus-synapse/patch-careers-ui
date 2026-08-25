/**
 * Auth form validation bridge.
 *
 * Pre-submit checks compose `@/lib/validation` (rules + `validation.*`
 * messages shared with every other form). Backend rejections go through
 * `extractApiErrorMessages`: `fields[]` (already localized by the server)
 * become inline errors, and a handful of top-level codes with an obvious
 * field (EMAIL_IN_USE…) are pinned to it. When there is inline detail there
 * is no toast — the same sentence twice on screen was the old behaviour.
 */

import { passwordSchema } from "@patch-careers/api-client";
import type { Locale, Translator } from "@patch-careers/i18n";
import {
  extractBackendPayload,
  type FetcherErrorLike,
  messageFromUnknown,
  translateBackendCode,
} from "@/lib/errors/backend-error";
import {
  fieldErrorsFromResponse,
  messageOf,
  validateEmail,
  validateName,
  validatePassword,
  validateRequired,
} from "@/lib/validation";

export interface AuthFieldErrors {
  name?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
}

const AUTH_FIELDS = ["name", "email", "password"] as const;
type AuthField = (typeof AUTH_FIELDS)[number];

/** Optional toast + field-level inline errors. */
export interface ApiErrorMessages {
  /** Toast title — `undefined` when the error is fully explained inline. */
  toast: string | undefined;
  fields: AuthFieldErrors;
}

// ────────────────────────────────────────────────────────────
// Pre-submit validation
// ────────────────────────────────────────────────────────────

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

/** Name is optional in the wire contract but required here — it seeds onboarding. */
export function validateSignup(payload: SignupPayload, t: Translator): AuthFieldErrors | null {
  return compact({
    name: messageOf(validateName(payload.name), t),
    email: messageOf(validateEmail(payload.email), t),
    password: messageOf(validatePassword(payload.password), t),
  });
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login only checks the email shape and that a password is present — the
 * backend won't apply the sign-up policy to existing (legacy) passwords.
 */
export function validateLogin(payload: LoginPayload, t: Translator): AuthFieldErrors | null {
  return compact({
    email: messageOf(validateEmail(payload.email), t),
    password: messageOf(validateRequired(payload.password), t),
  });
}

/** Standalone check — useful for "is the form valid yet" UI states. */
export function isPasswordStrong(value: string): boolean {
  return passwordSchema.safeParse(value).success;
}

function compact(errors: AuthFieldErrors): AuthFieldErrors | null {
  const out: AuthFieldErrors = {};
  for (const key of AUTH_FIELDS) if (errors[key]) out[key] = errors[key];
  return Object.keys(out).length > 0 ? out : null;
}

// ────────────────────────────────────────────────────────────
// Backend error → inline messages (+ toast when nothing is inline)
// ────────────────────────────────────────────────────────────

/** Top-level codes that clearly belong to one input. */
function fieldFromBackendCode(code: string | undefined): AuthField | null {
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

export function extractApiErrorMessages(
  err: unknown,
  locale: Locale,
  t: Translator,
  fallbackKey: string,
): ApiErrorMessages {
  const data = extractBackendPayload(err);
  const backendCode = typeof data.code === "string" ? data.code : undefined;
  const errorCode =
    typeof (err as FetcherErrorLike)?.code === "string"
      ? (err as FetcherErrorLike).code
      : undefined;
  const backendMessage =
    messageFromUnknown(data.message) ??
    messageFromUnknown(data.details) ??
    messageFromUnknown(data.errors) ??
    (err as FetcherErrorLike)?.message;
  const resolved = translateBackendCode(
    backendCode ?? errorCode,
    locale,
    t(fallbackKey),
    backendMessage,
  );

  const fields: AuthFieldErrors = {};
  const byPath = fieldErrorsFromResponse(err, locale);
  for (const key of AUTH_FIELDS) if (byPath[key]) fields[key] = byPath[key];

  const codedField = fieldFromBackendCode(backendCode);
  if (codedField && !fields[codedField]) fields[codedField] = resolved;

  const inline = Object.keys(fields).length > 0;
  return { toast: inline ? undefined : resolved, fields };
}
