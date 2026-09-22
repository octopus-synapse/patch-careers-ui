/**
 * <PublicProfileLanguageLinks> — the two language versions of a public page,
 * as links to their own addresses (decision 21). Not a toggle that mutates
 * state: `/u/…` and `/en/u/…` are two pages, and a visitor who lands on one
 * is handed the other's URL.
 */
import type { Locale } from "@patch-careers/i18n";
import { PillSwitch } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { useLocaleSwitch } from "@/navigation/use-locale-switch";
import { useI18n } from "@/providers/i18n-provider";

export function PublicProfileLanguageLinks({
  current,
}: {
  username: string;
  current: Locale;
}): ReactElement {
  const { t } = useI18n();
  const switchLocale = useLocaleSwitch();
  const options: Array<{ value: Locale; label: string; accessibilityLabel: string }> = [
    {
      value: "en",
      label: t("profile.publicProfile.languageEn"),
      accessibilityLabel: t("profile.publicProfile.languageA11y", {
        label: t("profile.publicProfile.languageEn"),
      }),
    },
    {
      value: "pt-BR",
      label: t("profile.publicProfile.languagePt"),
      accessibilityLabel: t("profile.publicProfile.languageA11y", {
        label: t("profile.publicProfile.languagePt"),
      }),
    },
  ];
  return (
    <PillSwitch
      value={current}
      options={options}
      onChange={(locale) => {
        if (locale !== current) void switchLocale(locale);
      }}
    />
  );
}
