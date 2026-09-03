/**
 * <PublicProfileLanguageLinks> — the two language versions of a public page,
 * as links to their own addresses (decision 21). Not a toggle that mutates
 * state: `/u/…` and `/en/u/…` are two pages, and a visitor who lands on one
 * is handed the other's URL.
 */
import type { Locale } from "@patch-careers/i18n";
import { type Href, Link } from "expo-router";
import type { ReactElement } from "react";
import { Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { usePp } from "../lib/styles";

export function PublicProfileLanguageLinks({
  username,
  current,
}: {
  username: string;
  current: Locale;
}): ReactElement {
  const { t } = useI18n();
  const pp = usePp();
  const options: Array<{ locale: Locale; label: string }> = [
    { locale: "pt-BR", label: t("profile.publicProfile.languagePt") },
    { locale: "en", label: t("profile.publicProfile.languageEn") },
  ];
  return (
    <View style={pp.langRow} accessibilityRole="none">
      {options.map((option) => {
        const on = option.locale === current;
        return on ? (
          <Text key={option.locale} style={[pp.langLink, pp.langLinkActive]} aria-current="page">
            {option.label}
          </Text>
        ) : (
          <Link
            key={option.locale}
            href={hrefFor(username, option.locale)}
            accessibilityLabel={t("profile.publicProfile.languageA11y", { label: option.label })}
            style={pp.langLink}
          >
            {option.label}
          </Link>
        );
      })}
    </View>
  );
}

/** Typed route for one language version — the same address `publicProfilePath` spells. */
function hrefFor(username: string, locale: Locale): Href {
  return locale === "en"
    ? { pathname: "/en/u/[username]", params: { username } }
    : { pathname: "/u/[username]", params: { username } };
}
