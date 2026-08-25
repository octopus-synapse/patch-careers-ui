/**
 * Field validators — each returns the FIRST failing `ValidationIssue` or
 * `null`. Screens render the issue with `validationMessage(issue, t)`.
 *
 * Formats come from the generated SDK (`emailSchema`, `usernameSchema`);
 * lengths and the password policy from `rules.ts`.
 */

import { emailSchema, usernameSchema } from "@patch-careers/api-client";
import type { Translator } from "@patch-careers/i18n";
import { validationMessage } from "./messages";
import {
  NAME_RULE,
  PASSWORD_POLICY,
  PASSWORD_RULES,
  USERNAME_RULE,
  type ValidationIssue,
} from "./rules";

const REQUIRED: ValidationIssue = { code: "REQUIRED" };

export function validateRequired(value: string): ValidationIssue | null {
  return value.trim().length === 0 ? REQUIRED : null;
}

export function validateLength(
  value: string,
  rule: { readonly min?: number | undefined; readonly max?: number | undefined },
): ValidationIssue | null {
  const length = value.length;
  if (rule.min !== undefined && length < rule.min) {
    return { code: "STRING_TOO_SHORT", params: { min: rule.min } };
  }
  if (rule.max !== undefined && length > rule.max) {
    return { code: "STRING_TOO_LONG", params: { max: rule.max } };
  }
  return null;
}

/** Display name: required, 2-100 (trimmed). */
export function validateName(value: string): ValidationIssue | null {
  const trimmed = value.trim();
  return validateRequired(trimmed) ?? validateLength(trimmed, NAME_RULE);
}

export function validateEmail(value: string): ValidationIssue | null {
  const trimmed = value.trim();
  if (validateRequired(trimmed)) return REQUIRED;
  return emailSchema.safeParse(trimmed).success ? null : { code: "EMAIL_INVALID" };
}

/** Full sign-up / change-password policy. Use `validateRequired` alone for login. */
export function validatePassword(value: string): ValidationIssue | null {
  if (!value) return REQUIRED;
  const length = validateLength(value, {
    min: PASSWORD_POLICY.minLength,
    max: PASSWORD_POLICY.maxLength,
  });
  if (length) return length;
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(value)) return rule.params ? { code: rule.code, params: rule.params } : rule;
  }
  return null;
}

export function validateUsername(value: string): ValidationIssue | null {
  const normalized = value.trim().toLowerCase();
  if (validateRequired(normalized)) return REQUIRED;
  const length = validateLength(normalized, USERNAME_RULE);
  if (length) return length;
  return usernameSchema.safeParse(normalized).success ? null : { code: "USERNAME_INVALID" };
}

/** Convenience: validator result → rendered message (or `undefined` when valid). */
export function messageOf(issue: ValidationIssue | null, t: Translator): string | undefined {
  return issue ? validationMessage(issue, t) : undefined;
}
