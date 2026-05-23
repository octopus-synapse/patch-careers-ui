import type { Locale, TranslationDict, TranslationParams, Translator } from "./types";

/**
 * Walks a dot-path through a (possibly nested) dictionary.
 * Returns `undefined` if any segment is missing or non-string.
 */
function resolve(dict: TranslationDict, key: string): string | undefined {
  const segments = key.split(".");
  let cursor: TranslationDict | string = dict;
  for (const segment of segments) {
    if (typeof cursor !== "object" || cursor === null) return undefined;
    const next: string | TranslationDict | undefined = (cursor as TranslationDict)[segment];
    if (next === undefined) return undefined;
    cursor = next;
  }
  return typeof cursor === "string" ? cursor : undefined;
}

const PARAM_RE = /\{([^{}]+)\}/g;

/**
 * Interpolates `{key}` tokens in a template using `params`.
 * Missing params are kept as `{key}` (so callers can spot them at runtime).
 */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(PARAM_RE, (match, raw: string) => {
    const name = raw.trim();
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Creates a translator bound to a dictionary and locale.
 * Missing keys fall back to the key itself.
 *
 * @example
 *   const t = createTranslator(ptBR, "pt-BR");
 *   t("hello", { name: "Mary" }); // "Olá, Mary!"
 *   t("missing.key");             // "missing.key"
 */
export function createTranslator(dict: TranslationDict, _locale: Locale): Translator {
  return (key, params) => {
    const template = resolve(dict, key);
    if (template === undefined) return key;
    return interpolate(template, params);
  };
}
