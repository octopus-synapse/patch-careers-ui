import type { Handle } from '@sveltejs/kit';
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from 'i18n';

function resolveLocale(event: Parameters<Handle>[0]['event']): Locale {
  const urlLang = event.params.lang;
  if (urlLang && isLocale(urlLang)) return urlLang;

  const cookie = event.cookies.get('locale');
  if (cookie && isLocale(cookie)) return cookie;

  const accept = event.request.headers.get('accept-language');
  if (accept) {
    const preferred = accept
      .split(',')
      .map((part) => part.split(';')[0].trim())
      .find((tag) => {
        if (isLocale(tag)) return true;
        const base = tag.split('-')[0];
        return LOCALES.some((l) => l.split('-')[0] === base);
      });
    if (preferred) {
      if (isLocale(preferred)) return preferred;
      const base = preferred.split('-')[0];
      const match = LOCALES.find((l) => l.split('-')[0] === base);
      if (match) return match;
    }
  }

  return DEFAULT_LOCALE;
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.locale = resolveLocale(event);

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.locale),
  });

  if (response.headers.get('content-type')?.includes('text/html')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
};
