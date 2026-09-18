/**
 * <PublicProfileLanguageLinks> — the two language versions of a public page,
 * as links to their own addresses (decision 21). Not a toggle that mutates
 * state: `/u/…` and `/en/u/…` are two pages, and a visitor who lands on one
 * is handed the other's URL.
 */
import type { Locale } from "@patch-careers/i18n";
import { PillSwitch } from "@patch-careers/ui/editorial";
import { type Href, useRouter } from "expo-router";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";

export function PublicProfileLanguageLinks({
  username,
  current,
}: {
  username: string;
  current: Locale;
}): ReactElement {
  const { t } = useI18n();
  const router = useRouter();
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
        if (locale !== current) router.push(hrefFor(username, locale));
      }}
    />
  );
}

/** Typed route for one language version — the same address `publicProfilePath` spells. */
function hrefFor(username: string, locale: Locale): Href {
  return locale === "en"
    ? { pathname: "/en/u/[username]", params: { username } }
    : { pathname: "/u/[username]", params: { username } };
}
