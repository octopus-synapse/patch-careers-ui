/**
 * useFormDraft — Svelte 5 rune helper that mirrors a form state object to
 * localStorage so accidental reloads or network failures don't wipe the user's
 * typing.
 *
 * Usage:
 *   const draft = useFormDraft('cv/experience', { title: '', company: '' });
 *   // bind:value={draft.state.title}
 *   // on submit:   draft.clear();
 */

export interface FormDraft<T extends Record<string, unknown>> {
  state: T;
  clear(): void;
  restoreFromStorage(): void;
}

const PREFIX = 'form-draft:';

export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  initial: T,
  options: { debounceMs?: number } = {},
): FormDraft<T> {
  const storageKey = `${PREFIX}${key}`;
  const debounceMs = options.debounceMs ?? 400;

  let state = $state<T>(structuredClone(initial));

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        state = { ...state, ...parsed };
      }
    } catch {
      // storage quota / privacy mode — fall back to in-memory only.
    }
  }

  let timeout: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (typeof window === 'undefined') return;
    // Touch every key so the effect re-runs on any change.
    const snapshot = JSON.stringify(state);
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, snapshot);
      } catch {
        // ignore quota errors
      }
    }, debounceMs);
  });

  function clear() {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    state = structuredClone(initial);
  }

  function restoreFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        state = { ...state, ...parsed };
      }
    } catch {
      // ignore
    }
  }

  return {
    get state() {
      return state;
    },
    set state(next: T) {
      state = next;
    },
    clear,
    restoreFromStorage,
  };
}
