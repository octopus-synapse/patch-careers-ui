/**
 * I18n provider — selects a locale + binds a `Translator` to it.
 *
 * Locale resolution priority (PR #6 baseline):
 *   1. explicit `<I18nProvider locale="pt-BR">` prop (tests/storybook)
 *   2. Expo `getLocales()[0].languageTag` if it matches a supported tag
 *   3. fallback to `pt-BR` (D66 — pt-BR is the default)
 *
 * PR #7+ adds the Zustand `localeStore` so users can override via
 * settings. For now we only read the system locale; user preference is
 * intentionally not yet persisted.
 */

import { createTranslator, en, type Locale, ptBR, type Translator } from "@patch-careers/i18n";
import { createContext, type ReactElement, type ReactNode, useContext, useMemo } from "react";
import { NativeModules, Platform } from "react-native";

interface I18nContextValue {
  readonly locale: Locale;
  readonly t: Translator;
}

const dictForLocale = (locale: Locale) => (locale === "en" ? en : ptBR);

/**
 * Best-effort device locale lookup without adding `expo-localization`
 * as a hard dep (it's heavy and only needed for richer Intl features
 * we don't use yet in PR #6). We use platform-specific natives or fall
 * back to `Intl` on web.
 */
function detectLocale(): Locale {
  try {
    let raw: string | undefined;
    if (Platform.OS === "ios") {
      const settings = NativeModules["SettingsManager"]?.settings as
        | { AppleLocale?: string; AppleLanguages?: readonly string[] }
        | undefined;
      raw = settings?.AppleLocale ?? settings?.AppleLanguages?.[0];
    } else if (Platform.OS === "android") {
      raw = (NativeModules["I18nManager"]?.localeIdentifier as string | undefined) ?? undefined;
    } else {
      raw = typeof navigator !== "undefined" ? navigator.language : undefined;
    }
    if (!raw) raw = Intl.DateTimeFormat().resolvedOptions().locale;
    return raw.toLowerCase().startsWith("en") ? "en" : "pt-BR";
  } catch {
    return "pt-BR";
  }
}

const defaultLocale: Locale = "pt-BR";

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  t: createTranslator(dictForLocale(defaultLocale), defaultLocale),
});

interface I18nProviderProps {
  readonly children: ReactNode;
  readonly locale?: Locale;
}

export function I18nProvider({ children, locale }: I18nProviderProps): ReactElement {
  const resolved = useMemo<I18nContextValue>(() => {
    const active = locale ?? detectLocale();
    return {
      locale: active,
      t: createTranslator(dictForLocale(active), active),
    };
  }, [locale]);

  return <I18nContext.Provider value={resolved}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export function useTranslator(): Translator {
  return useContext(I18nContext).t;
}
