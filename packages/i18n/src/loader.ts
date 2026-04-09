import type { Locale } from './config';
import type { Dictionary } from './types';

const cache = new Map<Locale, Dictionary>();

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('./dictionaries/en.json'),
  'pt-BR': () => import('./dictionaries/pt-BR.json'),
};

export async function loadDictionary(locale: Locale): Promise<Dictionary> {
  const cached = cache.get(locale);
  if (cached) return cached;

  const dictionary = (await loaders[locale]()) as Dictionary;
  cache.set(locale, dictionary);
  return dictionary;
}
