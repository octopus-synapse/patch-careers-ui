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

/** Minimal structural view of a Zod schema's `safeParse` (the Kubb exports satisfy it). */
type FormatSchema = { safeParse: (value: unknown) => { success: boolean } };

interface FieldRule {
  required?: boolean;
  min?: number;
  max?: number;
  format?: FormatSchema;
  formatMessage?: string;
}

const INVALID_URL_MESSAGE = "Informe uma URL válida";
const INVALID_USERNAME_MESSAGE = "Use apenas letras minúsculas, números e _";

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
    formatMessage: INVALID_USERNAME_MESSAGE,
  },
  // professionalProfile — summary is required (10-500); the rest are optional.
  headline: { min: 1, max: 120 },
  summary: { required: true, min: 10, max: 500 },
  linkedin: { format: linkedInUrlSchema, formatMessage: INVALID_URL_MESSAGE },
  github: { format: gitHubUrlSchema, formatMessage: INVALID_URL_MESSAGE },
  website: { format: socialUrlSchema, formatMessage: INVALID_URL_MESSAGE },
  portfolio: { format: socialUrlSchema, formatMessage: INVALID_URL_MESSAGE },
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
 * format). Returns a pt-BR error message, or `null` when valid / unmapped /
 * empty — emptiness is surfaced by the caller's `required` check
 * (`isProfileFieldRequired`), not here.
 */
export function validateProfileField(key: string, value: string): string | null {
  const rule = PROFILE_FIELD_RULES[key];
  if (!rule) return null;
  const v = value.trim();
  if (v.length === 0) return null;
  if (rule.min !== undefined && v.length < rule.min) return `Mínimo de ${rule.min} caracteres`;
  if (rule.max !== undefined && v.length > rule.max) return `Máximo de ${rule.max} caracteres`;
  if (rule.format && !rule.format.safeParse(v).success) {
    return rule.formatMessage ?? "Formato inválido";
  }
  return null;
}
