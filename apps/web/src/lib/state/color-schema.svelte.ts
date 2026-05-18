import type { ColorSchema } from 'ui';

let mode = $state<ColorSchema>('light');

export const colorSchema = {
  get mode() {
    return mode;
  },

  toggle() {
    mode = mode === 'light' ? 'dark' : 'light';
    // P2-#44: toggle the DOM class FIRST so the UI flips even if the
    // localStorage write fails (quota / private mode). The previous
    // order would leave `mode` updated but the page rendering the
    // wrong theme when `save()` threw.
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
    save();
  },

  init() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('colorSchema') as ColorSchema | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    mode = saved ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', mode === 'dark');
  },
};

function save() {
  // P2-#44: localStorage can throw in private mode / when the quota is
  // exhausted. Swallow with a console warn so the toggle remains
  // visually consistent even when persistence fails.
  try {
    localStorage.setItem('colorSchema', mode);
  } catch (err) {
    console.warn('colorSchema: failed to persist preference', err);
  }
}
