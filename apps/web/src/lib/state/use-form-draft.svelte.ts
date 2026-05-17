/**
 * useFormDraft — Svelte 5 rune helper that mirrors a form state object to
 * localStorage so accidental reloads or network failures don't wipe the user's
 * typing.
 *
 * Storage is namespaced per-user via `secureStorage` — drafts written by
 * user A cannot leak into user B's session on the same browser. Logout
 * wipes the entire per-user namespace via `clearForUser` (see
 * `lib/utils/secure-storage.svelte.ts`).
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

import { createSecureStorage, type SecureStorage } from '$lib/utils/secure-storage.svelte';
import { useAuth } from './auth.svelte';

export interface FormDraft<T extends Record<string, unknown>> {
  state: T;
  clear(): void;
  restoreFromStorage(): void;
}

const PREFIX = 'formDraft:';

function hydrate<T extends Record<string, unknown>>(
  storage: SecureStorage,
  storageKey: string,
  initial: T,
): T {
  const seed = structuredClone(initial);
  const parsed = storage.get<Partial<T>>(storageKey);
  if (!parsed) return seed;
  return { ...seed, ...parsed };
}

export function useFormDraft<T extends Record<string, unknown>>(
  key: string | (() => string),
  initial: T,
  options: { debounceMs?: number; storage?: SecureStorage } = {},
): FormDraft<T> {
  const getKey = typeof key === 'function' ? key : () => key;
  const debounceMs = options.debounceMs ?? 400;
  const auth = options.storage ? undefined : useAuth();
  const storage = options.storage ?? createSecureStorage(() => auth?.userId);

  const initialStorageKey = `${PREFIX}${getKey()}`;
  const state = $state<T>(hydrate(storage, initialStorageKey, initial));

  let timeout: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (typeof window === 'undefined') return;
    const snapshot = $state.snapshot(state) as T;
    const storageKey = `${PREFIX}${getKey()}`;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      storage.set(storageKey, snapshot);
    }, debounceMs);
  });

  let lastKey = $state(initialStorageKey);
  $effect(() => {
    const nextKey = `${PREFIX}${getKey()}`;
    if (nextKey === lastKey) return;
    lastKey = nextKey;
    const rehydrated = hydrate(storage, nextKey, initial);
    Object.assign(state, rehydrated);
  });

  function clear() {
    storage.remove(`${PREFIX}${getKey()}`);
    Object.assign(state, structuredClone(initial));
  }

  function restoreFromStorage() {
    Object.assign(state, hydrate(storage, `${PREFIX}${getKey()}`, initial));
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
