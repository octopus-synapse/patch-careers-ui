import type { QueryClient } from '@tanstack/svelte-query';
import type { Locale, Translator } from 'i18n';
import { createTranslator, DEFAULT_LOCALE, LOCALES, loadDictionary, NOOP_TRANSLATOR } from 'i18n';

let current = $state<Locale>(DEFAULT_LOCALE);
let translator = $state<Translator>(NOOP_TRANSLATOR);
let boundQueryClient: QueryClient | undefined;

const LOCALE_LABELS: Record<Locale, string> = {
  'pt-BR': 'Português',
  en: 'English',
};

const LOCALE_COOKIE = 'locale';
// Long-lived (1 year). Same-site lax so server can read it on the next
// navigation and `Accept-Language` propagation in `fetcher.ts` works.
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writeLocaleCookie(value: Locale): void {
  if (typeof document === 'undefined') return;
  // P2-#40: add `Secure` when the page is served over HTTPS. The cookie
  // is not security-critical (just a locale hint) but `SameSite=Lax`
  // without `Secure` invites mixed-protocol leaks if any subdomain ever
  // serves HTTP. Skip the flag on `http://localhost:*` so dev still
  // works without TLS.
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const flags = `path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure ? '; secure' : ''}`;
  // biome-ignore lint/suspicious/noDocumentCookie: locale cookie must be readable by SSR via the Cookie header; Cookie Store API would isolate it from the SSR pipeline.
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(value)}; ${flags}`;
}

function readLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  if (!match) return null;
  const decoded = decodeURIComponent(match[1]);
  return (LOCALES as readonly string[]).includes(decoded) ? (decoded as Locale) : null;
}

function detectBrowserLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null;
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    if ((LOCALES as readonly string[]).includes(tag)) return tag as Locale;
    const base = tag.split('-')[0];
    const match = LOCALES.find((l) => l.split('-')[0] === base);
    if (match) return match;
  }
  return null;
}

export const locale = {
  get current() {
    return current;
  },
  get t() {
    return translator;
  },
  get labels() {
    return LOCALE_LABELS;
  },
  get locales() {
    return LOCALES;
  },

  async set(value: Locale) {
    current = value;
    const dict = await loadDictionary(value);
    translator = createTranslator(dict, value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_COOKIE, value);
      writeLocaleCookie(value);
      document.documentElement.lang = value;
    }
    // Locale switches change `Accept-Language` on subsequent requests, so
    // cached responses are effectively stale. Invalidating forces refetch
    // and the UI re-renders with the new locale immediately instead of
    // waiting up to `staleTime` (60s default).
    boundQueryClient?.invalidateQueries();
  },

  /** Wire the QueryClient created in the root layout so `set` can invalidate
   *  cached responses on locale switch. Called once at boot; later calls
   *  override the binding (last writer wins). */
  setQueryClient(client: QueryClient) {
    boundQueryClient = client;
  },

  async init(preferred?: Locale) {
    // Resolution order: (1) explicit preferred from the route param,
    // (2) cookie (last user choice, also readable by the fetcher), (3)
    // legacy localStorage, (4) `navigator.language` derived match,
    // (5) `DEFAULT_LOCALE` fallback. Whichever wins gets written back to
    // the cookie so subsequent requests carry the right `Accept-Language`.
    if (preferred && LOCALES.includes(preferred)) {
      current = preferred;
    } else {
      const fromCookie = readLocaleCookie();
      if (fromCookie) {
        current = fromCookie;
      } else if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(LOCALE_COOKIE) as Locale | null;
        if (saved && LOCALES.includes(saved)) {
          current = saved;
        } else {
          const detected = detectBrowserLocale();
          if (detected) current = detected;
        }
      }
    }
    writeLocaleCookie(current);
    const dict = await loadDictionary(current);
    translator = createTranslator(dict, current);
    if (typeof window !== 'undefined') {
      document.documentElement.lang = current;
    }
  },
};
