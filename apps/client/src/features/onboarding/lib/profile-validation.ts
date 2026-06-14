/**
 * Per-field onboarding validation, mirroring the backend's COMPLETE-time
 * contract — not the laxer session schema.
 *
 * The session (`GET /v1/onboarding/session`) ships fields without
 * min/max/pattern and marks the profile loosely (everything optional), but
 * `POST .../session/complete` validates the assembled profile against
 * `OnboardingDataSchema` (profile-services), which is STRICTER:
 *   - PersonalInfoSchema: `fullName` (2-100) required; `phone`/`location` optional.
 *   - ProfessionalProfileSchema: `summary` REQUIRED (10-500); `headline` (1-120)
 *     and the URL fields optional.
 *   - UsernameSchema: required handle, lowercase `[a-z0-9_]` (3-30).
 * That's why a "complete"-looking profile (e.g. a headline but no summary) was
 * still rejected with INVALID_PROFESSIONAL_PROFILE.
 *
 * Format checks reuse the Kubb-generated Zod primitives (`socialUrlSchema` /
 * `linkedInUrlSchema` / `gitHubUrlSchema` = `.url()`, `usernameSchema` = regex)
 * via their `.safeParse`; lengths + requiredness mirror the schemas above.
 * Net effect: passing every step enforces the same rules as complete, so
 * finishing the flow actually finishes.
 */

import {
  gitHubUrlSchema,
  linkedInUrlSchema,
  socialUrlSchema,
  usernameSchema,
} from "@patch-careers/api-client";
import type { Translator } from "@patch-careers/i18n";

/** Minimal structural view of a Zod schema's `safeParse` (the Kubb exports satisfy it). */
type FormatSchema = { safeParse: (value: unknown) => { success: boolean } };

interface FieldRule {
  required?: boolean;
  min?: number;
  max?: number;
  format?: FormatSchema;
  formatMessageKey?: string;
}

const INVALID_URL_KEY = "onboarding.validation.invalidUrl";
const INVALID_USERNAME_KEY = "onboarding.validation.username";

const PROFILE_FIELD_RULES: Record<string, FieldRule> = {
  // personalInfo — fullName/phone/location are all required at complete.
  fullName: { required: true, min: 2, max: 100 },
  phone: { max: 20 },
  location: { max: 100 },
  username: {
    required: true,
    min: 3,
    max: 30,
    format: usernameSchema,
    formatMessageKey: INVALID_USERNAME_KEY,
  },
  // professionalProfile — summary is required (10-500); the rest are optional.
  headline: { min: 1, max: 120 },
  summary: { required: true, min: 10, max: 500 },
  linkedin: { format: linkedInUrlSchema, formatMessageKey: INVALID_URL_KEY },
  github: { format: gitHubUrlSchema, formatMessageKey: INVALID_URL_KEY },
  website: { format: socialUrlSchema, formatMessageKey: INVALID_URL_KEY },
  portfolio: { format: socialUrlSchema, formatMessageKey: INVALID_URL_KEY },
};

/** True when `key` has a contract rule (so callers can skip the backend fallback). */
export function hasProfileFieldRule(key: string): boolean {
  return key in PROFILE_FIELD_RULES;
}

/**
 * Whether a profile field is required at completion — mirrors the backend
 * complete-time schema, NOT the laxer session schema (so e.g. `summary` is
 * required even though the session marks it optional).
 */
export function isProfileFieldRequired(key: string): boolean {
  return PROFILE_FIELD_RULES[key]?.required === true;
}

/**
 * Validates a single profile field's value against its contract rule (length +
 * format). Returns a localized error message (via `t`), or `null` when valid /
 * unmapped / empty — emptiness is surfaced by the caller's `required` check
 * (`isProfileFieldRequired`), not here.
 */
export function validateProfileField(key: string, value: string, t: Translator): string | null {
  const rule = PROFILE_FIELD_RULES[key];
  if (!rule) return null;
  const v = value.trim();
  if (v.length === 0) return null;
  if (rule.min !== undefined && v.length < rule.min) {
    return t("onboarding.validation.minLength", { count: rule.min });
  }
  if (rule.max !== undefined && v.length > rule.max) {
    return t("onboarding.validation.maxLength", { count: rule.max });
  }
  if (rule.format && !rule.format.safeParse(v).success) {
    return t(rule.formatMessageKey ?? "onboarding.validation.invalidPattern");
  }
  return null;
}
