/**
 * I18n provider — selects a locale + binds a `Translator` to it, and lets
 * the app change it at runtime (the onboarding "Idioma" step).
 *
 * Locale resolution priority:
 *   1. explicit `<I18nProvider locale="pt-BR">` prop (tests/storybook)
 *   2. the user's persisted choice (set via `setLocale`, stored in
 *      `mundane` — the same adapter the onboarding drafts use)
 *   3. the browser language (web only — `navigator.language`; `en*`
 *      seeds English, everything else stays pt-BR). Supersedes D66's
 *      "never consult the device": the parity specs now guarantee a
 *      complete `en` dictionary, so the original half-translated-UI
 *      concern is gone. On native the onboarding "Idioma" step remains
 *      the switch.
 *   4. fallback to `pt-BR` (pt-BR-first product)
 *
 * Changing the locale re-binds the translator and (because the onboarding
 * session query is keyed by `locale`) refetches a translated session.
 */

import {
  createTranslator,
  en,
  isLocale,
  type Locale,
  ptBR,
  type Translator,
} from "@patch-careers/i18n";
import { LOCALE_STORE_KEY } from "@patch-careers/state";
import { mundane } from "@patch-careers/storage";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface I18nContextValue {
  readonly locale: Locale;
  readonly t: Translator;
  readonly setLocale: (locale: Locale) => void;
}

const dictForLocale = (locale: Locale) => (locale === "en" ? en : ptBR);

const defaultLocale: Locale = "pt-BR";

/**
 * Map a BCP-47 language tag to a supported locale. `pt*` and anything
 * unrecognised stay on pt-BR (primary market); `en*` gets English.
 */
export function localeFromLanguageTag(tag: string | undefined): Locale {
  return tag?.toLowerCase().startsWith("en") ? "en" : defaultLocale;
}

/** The browser language, on web; the product default elsewhere. */
function deviceLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  return localeFromLanguageTag(navigator.language);
}

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  t: createTranslator(dictForLocale(defaultLocale), defaultLocale),
  setLocale: () => undefined,
});

interface I18nProviderProps {
  readonly children: ReactNode;
  readonly locale?: Locale;
}

export function I18nProvider({ children, locale }: I18nProviderProps): ReactElement {
  const [active, setActive] = useState<Locale>(() => locale ?? deviceLocale());

  // An explicit prop (tests/storybook) always wins and is authoritative.
  useEffect(() => {
    if (locale) setActive(locale);
  }, [locale]);

  // Hydrate the persisted user choice once; it overrides the device
  // default but never an explicit prop.
  useEffect(() => {
    if (locale) return;
    let cancelled = false;
    mundane
      .getItem(LOCALE_STORE_KEY)
      .then((stored) => {
        if (!cancelled && isLocale(stored)) setActive(stored);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setActive(next);
    mundane.setItem(LOCALE_STORE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: active,
      t: createTranslator(dictForLocale(active), active),
      setLocale,
    }),
    [active, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export function useTranslator(): Translator {
  return useContext(I18nContext).t;
}
