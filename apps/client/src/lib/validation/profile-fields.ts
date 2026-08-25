/**
 * Profile-field contract — the rules the backend applies to the user's
 * profile, keyed by field key, for BOTH surfaces that edit it:
 *
 *   - Profile tab inline editors (`PATCH /v1/users/profile`): `name`,
 *     `headline`, `bio`, `location`, `phone`.
 *   - Onboarding COMPLETE (`OnboardingDataSchema`, stricter than the session
 *     schema): `fullName`, `username`, `summary`, the URL fields…
 *
 * The two surfaces use different keys for overlapping concepts (`name` vs
 * `fullName`, `bio` vs `summary`) because the backend schemas differ
 * (summary is 10-500 at complete; bio is 1-500 on PATCH) — so both rows
 * exist, and each surface reads the one its API validates.
 */

import {
  gitHubUrlSchema,
  linkedInUrlSchema,
  socialUrlSchema,
  usernameSchema,
} from "@patch-careers/api-client";
import type { Translator } from "@patch-careers/i18n";
import { validationMessage } from "./messages";
import { NAME_RULE, USERNAME_RULE, type ValidationIssue } from "./rules";
import { validateLength } from "./validators";

/** Minimal structural view of a Zod schema's `safeParse` (the Kubb exports satisfy it). */
type FormatSchema = { safeParse: (value: unknown) => { success: boolean } };

export interface ProfileFieldRule {
  readonly required?: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly format?: FormatSchema;
  /** Issue code when `format` rejects (default PATTERN_MISMATCH). */
  readonly formatCode?: string;
}

// ── Phone (BR-friendly, lenient) ─────────────────────────────────────────
// A BR number is 10 digits (landline) or 11 (mobile); with the +55 country
// code that's 12-13. International input (leading "+") stays permissive.
const phoneDigits = (value: string): string => value.replace(/\D/g, "");
const phoneFormat: FormatSchema = {
  safeParse: (value) => {
    const text = String(value);
    const digits = phoneDigits(text);
    const ok = text.trim().startsWith("+")
      ? digits.length >= 8 && digits.length <= 15
      : digits.length === 10 || digits.length === 11;
    return { success: ok };
  },
};

const URL: ProfileFieldRule = { format: socialUrlSchema, formatCode: "URL_INVALID" };

export const PROFILE_FIELD_RULES: Readonly<Record<string, ProfileFieldRule>> = {
  // PATCH /v1/users/profile
  name: { required: true, ...NAME_RULE },
  headline: { max: 120 },
  bio: { min: 1, max: 500 },
  location: { max: 100 },
  phone: { max: 20, format: phoneFormat, formatCode: "PHONE_INVALID" },
  // Onboarding complete-time contract
  fullName: { required: true, ...NAME_RULE },
  username: {
    required: true,
    ...USERNAME_RULE,
    format: usernameSchema,
    formatCode: "USERNAME_INVALID",
  },
  summary: { required: true, min: 10, max: 500 },
  linkedin: { format: linkedInUrlSchema, formatCode: "URL_INVALID" },
  github: { format: gitHubUrlSchema, formatCode: "URL_INVALID" },
  website: URL,
  portfolio: URL,
};

/** True when `key` has a contract rule (so callers can skip the backend fallback). */
export function hasProfileFieldRule(key: string): boolean {
  return key in PROFILE_FIELD_RULES;
}

export function isProfileFieldRequired(key: string): boolean {
  return PROFILE_FIELD_RULES[key]?.required === true;
}

/** Max length per field, for inline character counters. */
export function profileFieldMaxLength(key: string): number | undefined {
  return PROFILE_FIELD_RULES[key]?.max;
}

export function profileFieldIssue(key: string, value: string): ValidationIssue | null {
  const rule = PROFILE_FIELD_RULES[key];
  if (!rule) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return rule.required ? { code: "REQUIRED" } : null;
  const length = validateLength(trimmed, rule);
  if (length) return length;
  if (rule.format && !rule.format.safeParse(trimmed).success) {
    return { code: rule.formatCode ?? "PATTERN_MISMATCH" };
  }
  return null;
}

/**
 * Validate one field's value → localized message, or `null` when valid,
 * unmapped, or optional-and-empty (clearing is how the owner removes a value).
 */
export function validateProfileField(key: string, value: string, t: Translator): string | null {
  const issue = profileFieldIssue(key, value);
  return issue ? validationMessage(issue, t) : null;
}
