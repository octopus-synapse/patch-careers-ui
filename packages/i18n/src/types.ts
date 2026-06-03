/**
 * Public type surface for `@patch-careers/i18n`.
 *
 * `TranslationDict` is recursive — values are either strings (leaves)
 * or nested dictionaries (groups). The translator accesses leaves via
 * dot-paths (`"common.actions.save"`).
 *
 * Supported locales (D66): `pt-BR` (default) and `en`. The api-client
 * package re-exports its own typed dictionaries that supersede the
 * placeholder ones here (PR #5).
 */

export type Locale = "pt-BR" | "en";

/** Runtime guard for a supported locale tag (single source for the rule). */
export function isLocale(value: unknown): value is Locale {
  return value === "pt-BR" || value === "en";
}

export type TranslationLeaf = string;

export interface TranslationDict {
  readonly [key: string]: TranslationLeaf | TranslationDict;
}

export type TranslationParams = Readonly<Record<string, string | number>>;

/** A translator bound to a locale + dictionary. */
export type Translator = (key: string, params?: TranslationParams) => string;
