/**
 * Single source of truth for client-side profile-field validation.
 *
 * The limits mirror the profile contract — the field descriptions on
 * `patchV1UsersProfileMutationRequest` in `@patch-careers/api-client`
 * (name 2-100, headline ≤120, bio 1-500, location ≤100, phone ≤20). The
 * generated zod only carries types, not min/max, so we encode the
 * documented constraints here once and drive both the row `required` flag
 * and the inline editor validation from it — no rules scattered per field.
 */

import type { Translator } from "@patch-careers/i18n";
import { z } from "zod";
import type { ProfileFieldKey } from "./profile-fields";

export const PROFILE_FIELD_LIMITS = {
  name: { min: 2, max: 100 },
  headline: { max: 120 },
  bio: { min: 1, max: 500 },
  location: { max: 100 },
  phone: { max: 20 },
} as const;

/** Fields the owner must fill (others may be cleared back to empty). */
const REQUIRED_FIELDS: ReadonlySet<ProfileFieldKey> = new Set(["name"]);

export function isProfileFieldRequired(key: ProfileFieldKey): boolean {
  return REQUIRED_FIELDS.has(key);
}

/** Max length per field, for the inline character counter. */
export function profileFieldMaxLength(key: ProfileFieldKey): number {
  return PROFILE_FIELD_LIMITS[key].max;
}

// ── Phone (BR-friendly, lenient) ─────────────────────────────────────────
//
// A BR number is 10 digits (landline) or 11 (mobile); with the +55 country
// code that's 12-13. We accept any of those, and stay permissive for
// international numbers entered with a leading "+".

const phoneDigits = (value: string): string => value.replace(/\D/g, "");

function isValidPhone(value: string): boolean {
  const digits = phoneDigits(value);
  if (value.trim().startsWith("+")) return digits.length >= 8 && digits.length <= 15;
  return digits.length === 10 || digits.length === 11;
}

/**
 * Progressive BR mask applied as the user types: `(11) 99999-9999` for
 * mobiles, `(11) 9999-9999` for landlines. International input (leading
 * `+`) is left untouched beyond stripping disallowed characters.
 */
export function formatPhoneBR(input: string): string {
  if (input.trim().startsWith("+")) return input.replace(/[^\d+\s()-]/g, "");
  const d = phoneDigits(input).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ── zod field schemas ────────────────────────────────────────────────────

const L = PROFILE_FIELD_LIMITS;

export const profileFieldSchemas = {
  name: z.string().trim().min(L.name.min).max(L.name.max),
  headline: z.string().trim().max(L.headline.max),
  bio: z.string().trim().min(L.bio.min).max(L.bio.max),
  location: z.string().trim().max(L.location.max),
  phone: z.string().trim().max(L.phone.max).refine(isValidPhone),
} as const satisfies Record<ProfileFieldKey, z.ZodTypeAny>;

/**
 * Validate one field's value. Returns a translated error message, or `null`
 * when valid. Optional fields left empty are always valid (clearing them is
 * how the owner removes a value).
 */
export function validateProfileField(
  key: ProfileFieldKey,
  value: string,
  t: Translator,
): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return isProfileFieldRequired(key) ? t(`profile.validation.${key}.required`) : null;
  }
  const result = profileFieldSchemas[key].safeParse(trimmed);
  if (result.success) return null;
  return t(`profile.validation.${key}.invalid`);
}
