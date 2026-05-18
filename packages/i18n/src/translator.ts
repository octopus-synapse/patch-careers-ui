import type { Locale } from './config';
import type { Dictionary, TranslateParams, Translator } from './types';

function resolve(dictionary: Dictionary, key: string): string | undefined {
  const segments = key.split('.');
  let current: string | Dictionary = dictionary;

  for (const segment of segments) {
    if (typeof current !== 'object' || current === null) return undefined;
    const next: string | Dictionary | undefined = current[segment];
    if (next === undefined) return undefined;
    current = next;
  }

  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params: TranslateParams): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`,
  );
}

function pluralize(
  dictionary: Dictionary,
  key: string,
  count: number,
  locale: Locale,
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
    // P2-#56: coerce `count` to a number when it arrives as a numeric
    // string (common when the value comes straight from an API field
    // serialised as `"1"`). Previously the strict `typeof === 'number'`
    // gate skipped pluralisation, so `t('items.label', { count: '1' })`
    // returned the bare key when only `items.label_one` existed.
    const rawCount = params?.count;
    const numericCount =
      typeof rawCount === 'number'
        ? rawCount
        : typeof rawCount === 'string' &&
            rawCount.trim() !== '' &&
            Number.isFinite(Number(rawCount))
          ? Number(rawCount)
          : undefined;
    if (numericCount !== undefined) {
      value = pluralize(dictionary, key, numericCount, locale) ?? resolve(dictionary, key);
    } else {
      value = resolve(dictionary, key);
    }
    if (value === undefined) return key;
    return params ? interpolate(value, params) : value;
  };
}
