import type { ColorSchema } from 'ui';

let mode = $state<ColorSchema>('light');

export const colorSchema = {
	get mode() {
		return mode;
	},

	toggle() {
		mode = mode === 'light' ? 'dark' : 'light';
		save();
	},

	init() {
		if (typeof window === 'undefined') return;
		const saved = localStorage.getItem('colorSchema') as ColorSchema | null;
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		mode = saved ?? (prefersDark ? 'dark' : 'light');
	}
};

function save() {
	localStorage.setItem('colorSchema', mode);
}
