/**
 * Validation code → i18n key. The only table of its kind: local validators
 * and backend `fields[]` fallbacks both render through it, so a rule reads
 * the same whichever side rejected the value.
 *
 * Keys live under the flat `validation.*` namespace (field-agnostic
 * sentences — "Mínimo de 2 caracteres" — rendered under the input).
 */

import type { Translator } from "@patch-careers/i18n";
import type { ValidationIssue } from "./rules";

const CODE_TO_KEY: Readonly<Record<string, string>> = {
  // Backend VALIDATION_DICTIONARY codes (zodIssueToCode + password rules).
  REQUIRED: "validation.required",
  STRING_TOO_SHORT: "validation.minLength",
  STRING_TOO_LONG: "validation.maxLength",
  EMAIL_INVALID: "validation.emailInvalid",
  URL_INVALID: "validation.invalidUrl",
  PATTERN_MISMATCH: "validation.invalidPattern",
  VALIDATION_GENERIC: "validation.invalidPattern",
  PASSWORD_NEEDS_UPPERCASE: "validation.passwordNeedsUppercase",
  PASSWORD_NEEDS_LOWERCASE: "validation.passwordNeedsLowercase",
  PASSWORD_NEEDS_DIGIT: "validation.passwordNeedsDigit",
  PASSWORD_NEEDS_SYMBOL: "validation.passwordNeedsSymbol",
  PASSWORD_WEAK: "validation.passwordWeak",
  // Client-only refinements (the backend reports these as PATTERN_MISMATCH).
  USERNAME_INVALID: "validation.username",
  PHONE_INVALID: "validation.phoneInvalid",
  PASSWORD_MISMATCH: "validation.passwordMismatch",
};

export function validationKeyFor(code: string): string | undefined {
  return CODE_TO_KEY[code];
}

/** Renders an issue via `t`. Unknown codes surface as-is (loud, like a missing key). */
export function validationMessage(issue: ValidationIssue, t: Translator): string {
  const key = CODE_TO_KEY[issue.code];
  if (!key) return issue.code;
  return issue.params ? t(key, issue.params) : t(key);
}
