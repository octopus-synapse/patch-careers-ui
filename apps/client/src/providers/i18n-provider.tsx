/**
 * I18n provider — selects a locale + binds a `Translator` to it, and lets
 * the app change it at runtime (the onboarding "Idioma" step).
 *
 * On web the URL is authoritative. Native keeps the persisted choice and
 * defaults to pt-BR. An explicit locale prop pins a nested translation
 * surface, such as document chrome, without changing the page URL.
 *
 * Changing the locale re-binds the translator and (because the onboarding
 * session query is keyed by `locale`) refetches a translated session.
 */

import { setApiClientLocale } from "@patch-careers/api-client";
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
import { usePathname } from "expo-router";
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
import { Platform } from "react-native";
import { localeFromPath } from "@/navigation/route-locale";

interface I18nContextValue {
  readonly locale: Locale;
  readonly t: Translator;
  readonly setLocale: (locale: Locale) => void;
  /** True once the persisted choice has been read (or an explicit prop
   *  made hydration moot). Gates decisions that must not fire on the
   *  device-seeded value — e.g. the `/` → `/en` locale redirect. */
  readonly hydrated: boolean;
}

const dictForLocale = (locale: Locale) => (locale === "en" ? en : ptBR);

/**
 * A translator for a locale that is NOT the interface's. ADR-0011: the
 * document surfaces (resume detail, export) render their chrome in the
 * document's language, which may differ from the app's. Memoized per locale —
 * there are two.
 */
const translators = new Map<Locale, Translator>();
export function translatorFor(locale: Locale): Translator {
  let t = translators.get(locale);
  if (!t) {
    t = createTranslator(dictForLocale(locale), locale);
    translators.set(locale, t);
  }
  return t;
}

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
  hydrated: true,
});

interface I18nProviderProps {
  readonly children: ReactNode;
  readonly locale?: Locale;
}

export function I18nProvider({ children, locale }: I18nProviderProps): ReactElement {
  const pathname = usePathname();
  const [active, setActive] = useState<Locale>(() =>
    locale ?? (Platform.OS === "web" ? localeFromPath(pathname) : deviceLocale()),
  );
  const [hydrated, setHydrated] = useState<boolean>(() => locale !== undefined);
  // A pinned provider (the `/en` tree) renders a fixed locale; a language
  // switch there must reach the ROOT provider, or the persisted choice and
  // the in-memory root state drift apart and the `/en` bounce sends the
  // user right back. Chain writes to the parent when a prop pins us.
  const parent = useContext(I18nContext);

  // An explicit prop (tests/storybook) always wins and is authoritative.
  useEffect(() => {
    if (!locale) return;
    setActive(locale);
    setHydrated(true);
  }, [locale]);

  // Hydrate the persisted user choice once; it overrides the device
  // default but never an explicit prop.
  useEffect(() => {
    if (locale || Platform.OS === "web") return;
    let cancelled = false;
    mundane
      .getItem(LOCALE_STORE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (isLocale(stored)) setActive(stored);
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // Keep browser history authoritative after navigation, while still allowing
  // setLocale to update the current screen immediately before the twin route
  // finishes loading.
  useEffect(() => {
    if (locale || Platform.OS !== "web") return;
    setActive(localeFromPath(pathname));
  }, [locale, pathname]);

  const resolved = locale ?? active;

  // The server localizes its own strings (errors, dictionaries) from
  // `Accept-Language`; keep it in step with whatever this provider renders.
  useEffect(() => {
    setApiClientLocale(resolved);
  }, [resolved]);

  useEffect(() => {
    if (Platform.OS === "web" && locale === undefined) document.documentElement.lang = resolved;
  }, [resolved, locale]);

  const pinned = locale !== undefined;
  const parentSetLocale = parent.setLocale;
  const setLocale = useCallback(
    (next: Locale) => {
      if (pinned) {
        // The prop wins locally; forward the choice so the root updates
        // state + storage (the default context's setLocale is a no-op).
        parentSetLocale(next);
        return;
      }
      setActive(next);
      if (Platform.OS !== "web") mundane.setItem(LOCALE_STORE_KEY, next).catch(() => undefined);
    },
    [pinned, parentSetLocale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: resolved,
      t: createTranslator(dictForLocale(resolved), resolved),
      setLocale,
      hydrated: Platform.OS === "web" ? true : hydrated,
    }),
    [resolved, setLocale, hydrated],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export function useTranslator(): Translator {
  return useContext(I18nContext).t;
}
