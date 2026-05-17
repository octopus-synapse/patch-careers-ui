import type { Handle } from '@sveltejs/kit';
import { setAcceptLanguageProvider } from 'api-client';
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from 'i18n';
import { parseAcceptLanguage } from '$lib/utils/accept-language';

// Exported for unit testing — see hooks-lang-replace.test.ts. SvelteKit
// can emit `%lang%` more than once per chunk when SEO snippets
// (canonical/hreflang link rels, JSON-LD `inLanguage`) reference the
// active locale, so we must replace every occurrence, not just the first.
export function applyLangToChunk(html: string, locale: Locale): string {
  return html.replaceAll('%lang%', locale);
}

function resolveLocale(event: Parameters<Handle>[0]['event']): Locale {
  const urlLang = event.params.lang;
  if (urlLang && isLocale(urlLang)) return urlLang;

  const cookie = event.cookies.get('locale');
  if (cookie && isLocale(cookie)) return cookie;

  const accept = event.request.headers.get('accept-language');
  if (accept) {
    for (const { tag } of parseAcceptLanguage(accept)) {
      if (isLocale(tag)) return tag;
      const base = tag.split('-')[0] ?? tag;
      const match = LOCALES.find((l) => l.split('-')[0] === base);
      if (match) return match;
    }
  }

  return DEFAULT_LOCALE;
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.locale = resolveLocale(event);

  // Per-request provider for Accept-Language. The fetcher is module-level
  // singleton state; re-binding here on every request keeps server-side
  // SDK calls within this handler reading THIS request's locale rather
  // than whichever request happened to set it last.
  setAcceptLanguageProvider(() => event.locals.locale);

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => applyLangToChunk(html, event.locals.locale),
  });

  if (response.headers.get('content-type')?.includes('text/html')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
};
