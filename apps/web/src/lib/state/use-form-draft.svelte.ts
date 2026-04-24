/**
 * useFormDraft — Svelte 5 rune helper that mirrors a form state object to
 * localStorage so accidental reloads or network failures don't wipe the user's
 * typing.
 *
 * Usage:
 *   const draft = useFormDraft('cv/experience', { title: '', company: '' });
 *   // bind:value={draft.state.title}
 *   // on submit:   draft.clear();
 *
 * If the key is derived from reactive state (e.g. a route param), pass a
 * getter so the hook can re-key the storage slot when it changes:
 *   useFormDraft(() => `cv-${resumeId}`, ...)
 */

export interface FormDraft<T extends Record<string, unknown>> {
  state: T;
  clear(): void;
  restoreFromStorage(): void;
}

const PREFIX = 'form-draft:';

function hydrate<T extends Record<string, unknown>>(storageKey: string, initial: T): T {
  const seed = structuredClone(initial);
  if (typeof window === 'undefined') return seed;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...seed, ...parsed };
  } catch {
    return seed;
  }
}

export function useFormDraft<T extends Record<string, unknown>>(
  key: string | (() => string),
  initial: T,
  options: { debounceMs?: number } = {},
): FormDraft<T> {
  const getKey = typeof key === 'function' ? key : () => key;
  const debounceMs = options.debounceMs ?? 400;

  const initialStorageKey = `${PREFIX}${getKey()}`;
  const state = $state<T>(hydrate(initialStorageKey, initial));

  let timeout: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (typeof window === 'undefined') return;
    // Read both state and key so the effect re-runs on either change.
    const snapshot = JSON.stringify(state);
    const storageKey = `${PREFIX}${getKey()}`;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, snapshot);
      } catch {
        // ignore quota errors
      }
    }, debounceMs);
  });

  // When the key changes (e.g. route param), re-hydrate from the new slot.
  let lastKey = $state(initialStorageKey);
  $effect(() => {
    const nextKey = `${PREFIX}${getKey()}`;
    if (nextKey === lastKey) return;
    lastKey = nextKey;
    const rehydrated = hydrate(nextKey, initial);
    Object.assign(state, rehydrated);
  });

  function clear() {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(`${PREFIX}${getKey()}`);
      } catch {
        // ignore
      }
    }
    Object.assign(state, structuredClone(initial));
  }

  function restoreFromStorage() {
    Object.assign(state, hydrate(`${PREFIX}${getKey()}`, initial));
  }

  return {
    get state() {
      return state;
    },
    set state(next: T) {
      Object.assign(state, next);
    },
    clear,
    restoreFromStorage,
  };
}
