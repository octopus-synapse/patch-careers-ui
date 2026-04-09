export const LOCALES = ['pt-BR', 'en'] as const;

export const DEFAULT_LOCALE = LOCALES[0];

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
