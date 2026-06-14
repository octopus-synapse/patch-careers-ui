/**
 * Bridges the i18n catalog into the props `<PasswordStrengthMeter>` expects.
 * The meter lives in `@patch-careers/ui` (presentation layer) and never
 * imports the translator — screens pass localized strings in. Shared by
 * sign-up and reset-password so the `auth.passwordStrength.*` keys map in
 * one place.
 */

import type { Translator } from "@patch-careers/i18n";
import type { PasswordHints, StrengthLabels } from "@patch-careers/ui/editorial";

export function passwordMeterLabels(t: Translator): {
  hints: PasswordHints;
  strengthLabels: StrengthLabels;
} {
  return {
    hints: {
      length: t("auth.passwordStrength.hintChars"),
      case: t("auth.passwordStrength.hintCase"),
      digit: t("auth.passwordStrength.hintDigit"),
      symbol: t("auth.passwordStrength.hintSymbol"),
    },
    strengthLabels: {
      1: t("auth.passwordStrength.weak"),
      2: t("auth.passwordStrength.fair"),
      3: t("auth.passwordStrength.good"),
      4: t("auth.passwordStrength.strong"),
    },
  };
}
