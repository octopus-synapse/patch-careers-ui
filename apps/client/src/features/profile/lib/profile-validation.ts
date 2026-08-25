/**
 * Profile tab's view of the profile contract. Rules live in
 * `@/lib/validation/profile-fields` (shared with onboarding); this module
 * narrows them to `ProfileFieldKey` and keeps the BR phone mask, which is
 * presentation, not validation.
 */

import type { Translator } from "@patch-careers/i18n";
import {
  isProfileFieldRequired as isRequired,
  profileFieldMaxLength as maxLength,
  validateProfileField as validate,
} from "@/lib/validation";
import type { ProfileFieldKey } from "./profile-fields";

export function isProfileFieldRequired(key: ProfileFieldKey): boolean {
  return isRequired(key);
}

/** Max length per field, for the inline character counter. */
export function profileFieldMaxLength(key: ProfileFieldKey): number {
  return maxLength(key) ?? Number.POSITIVE_INFINITY;
}

export function validateProfileField(
  key: ProfileFieldKey,
  value: string,
  t: Translator,
): string | null {
  return validate(key, value, t);
}

// ── Phone mask (BR) ──────────────────────────────────────────────────────

const phoneDigits = (value: string): string => value.replace(/\D/g, "");

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
