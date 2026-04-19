export const LOCALES = ['pt-BR', 'en'] as const;

export const DEFAULT_LOCALE = LOCALES[0];

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Locales that need right-to-left reading order. Keep in sync with any future
 * locale additions (ar, he, fa, ur, etc.).
 */
export const RTL_LOCALES = new Set<string>(['ar', 'he', 'fa', 'ur']);

export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  const base = locale.split('-')[0] ?? locale;
  return RTL_LOCALES.has(base) ? 'rtl' : 'ltr';
}
