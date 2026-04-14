import type { Locale } from './config';
import type { Dictionary, TranslateParams, Translator } from './types';

function resolve(dictionary: Dictionary, key: string): string | undefined {
  const segments = key.split('.');
  let current: string | Dictionary = dictionary;

  for (const segment of segments) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = current[segment];
  }

  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params: TranslateParams): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`
  );
}

function pluralize(
  dictionary: Dictionary,
  key: string,
  count: number,
  locale: Locale
): string | undefined {
  const category = new Intl.PluralRules(locale).select(count);
  return resolve(dictionary, `${key}_${category}`) ?? resolve(dictionary, `${key}_other`);
}

/**
 * No-op translator that returns the key as-is.
 * Used as default before async dictionary loading completes,
 * so that locale.t is never null.
 */
export const NOOP_TRANSLATOR: Translator = (key) => key;

export function createTranslator(dictionary: Dictionary, locale: Locale): Translator {
  return (key, params) => {
    let value: string | undefined;
    if (params && typeof params.count === 'number') {
      value = pluralize(dictionary, key, params.count, locale) ?? resolve(dictionary, key);
    } else {
      value = resolve(dictionary, key);
    }
    if (value === undefined) return key;
    return params ? interpolate(value, params) : value;
  };
}
