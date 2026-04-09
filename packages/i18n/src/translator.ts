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

export function createTranslator(dictionary: Dictionary): Translator {
  return (key, params) => {
    const value = resolve(dictionary, key);
    if (value === undefined) return key;
    return params ? interpolate(value, params) : value;
  };
}
