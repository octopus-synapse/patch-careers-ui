/**
 * Pure password-strength logic for the editorial `<PasswordStrengthMeter>`.
 *
 * Kept separate from `password-strength.ts` (which powers the generic
 * `<PasswordStrengthBar>`) on purpose: the editorial meter uses a different
 * scoring rule — it returns 0 for passwords shorter than 6 chars regardless
 * of other signals — plus a label + color ramp drawn from the editorial
 * palette. Sharing one resolver would couple two unrelated visual treatments.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { passwordScore, passwordSignals } from "./password-strength";

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

/** 4 signals (length>=8, mixed case, digit, symbol); hard 0 below 6 chars. */
export function scorePassword(password: string): PasswordStrengthScore {
  if (!password) return 0;
  if (password.length < 6) return 0;
  return passwordScore(passwordSignals(password));
}

export const STRENGTH_LABEL: Record<PasswordStrengthScore, string> = {
  0: "—",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

export const STRENGTH_COLOR: Record<PasswordStrengthScore, string> = {
  0: editorialPalette.hairline,
  1: editorialPalette.danger,
  2: editorialPalette.warn,
  3: editorialPalette.fair,
  4: editorialPalette.success,
};

export type PasswordHints = {
  length: string;
  case: string;
  digit: string;
  symbol: string;
};

export type PasswordCheck = { ok: boolean; label: string };

/** The 4 requirement chips shown under the meter, with i18n-able labels. */
export function passwordChecks(password: string, hints?: PasswordHints): PasswordCheck[] {
  return [
    { ok: password.length >= 8, label: hints?.length ?? "8+ chars" },
    { ok: /[A-Z]/.test(password) && /[a-z]/.test(password), label: hints?.case ?? "Aa" },
    { ok: /\d/.test(password), label: hints?.digit ?? "0-9" },
    { ok: /[^A-Za-z0-9]/.test(password), label: hints?.symbol ?? "Symbol" },
  ];
}
