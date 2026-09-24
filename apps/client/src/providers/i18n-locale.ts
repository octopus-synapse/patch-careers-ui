import type { Locale } from "@patch-careers/i18n";

const DEFAULT_LOCALE: Locale = "pt-BR";

/** Map a BCP-47 language tag to one of the interface locales. */
export function localeFromLanguageTag(tag: string | undefined): Locale {
  return tag?.toLowerCase().startsWith("en") ? "en" : DEFAULT_LOCALE;
}
