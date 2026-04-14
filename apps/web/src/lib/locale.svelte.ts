import { LOCALES, DEFAULT_LOCALE, loadDictionary, createTranslator, NOOP_TRANSLATOR } from 'i18n';
import type { Locale, Translator } from 'i18n';

let current = $state<Locale>(DEFAULT_LOCALE);
let translator = $state<Translator>(NOOP_TRANSLATOR);

const LOCALE_LABELS: Record<Locale, string> = {
	'pt-BR': 'Português',
	en: 'English'
};

export const locale = {
	get current() {
		return current;
	},
	get t() {
		return translator;
	},
	get labels() {
		return LOCALE_LABELS;
	},
	get locales() {
		return LOCALES;
	},

	async set(value: Locale) {
		current = value;
		const dict = await loadDictionary(value);
		translator = createTranslator(dict, value);
		if (typeof window !== 'undefined') {
			localStorage.setItem('locale', value);
			document.documentElement.lang = value;
		}
	},

	async init(preferred?: Locale) {
		if (preferred && LOCALES.includes(preferred)) {
			current = preferred;
		} else if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('locale') as Locale | null;
			if (saved && LOCALES.includes(saved)) {
				current = saved;
			}
		}
		const dict = await loadDictionary(current);
		translator = createTranslator(dict, current);
		if (typeof window !== 'undefined') {
			document.documentElement.lang = current;
		}
	}
};
