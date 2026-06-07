import type { KeyValueStorage } from "./interface";

/**
 * Wraps a synchronous browser Storage (localStorage / sessionStorage)
 * behind the async KeyValueStorage contract.
 *
 * In non-browser test environments where Storage is absent, the adapter
 * falls back to an in-memory Map so unit tests do not need jsdom for
 * smoke checks. Tests that explicitly want browser semantics use jsdom.
 */
type SyncStore = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
};

/**
 * Normalises the real `Storage` and the in-memory `Map` fallback to one
 * uniform synchronous surface, so the public async methods don't each
 * branch on `store instanceof Map`.
 */
function adapt(store: Storage | Map<string, string>): SyncStore {
  if (store instanceof Map) {
    return {
      get: (key) => store.get(key) ?? null,
      set: (key, value) => {
        store.set(key, value);
      },
      remove: (key) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      keys: () => Array.from(store.keys()),
    };
  }
  return {
    get: (key) => store.getItem(key),
    set: (key, value) => {
      store.setItem(key, value);
    },
    remove: (key) => {
      store.removeItem(key);
    },
    clear: () => {
      store.clear();
    },
    keys: () => {
      const out: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k !== null) out.push(k);
      }
      return out;
    },
  };
}

export function createWebStorage(getBackend: () => Storage | undefined): KeyValueStorage {
  const memoryFallback = new Map<string, string>();
  const store = (): SyncStore => adapt(getBackend() ?? memoryFallback);

  return {
    async getItem(key) {
      return store().get(key);
    },
    async setItem(key, value) {
      store().set(key, value);
    },
    async removeItem(key) {
      store().remove(key);
    },
    async clear() {
      store().clear();
    },
    async getAllKeys() {
      return store().keys();
    },
  };
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof globalThis.localStorage !== "undefined" ? globalThis.localStorage : undefined;
  } catch {
    return undefined;
  }
}

function safeSessionStorage(): Storage | undefined {
  try {
    return typeof globalThis.sessionStorage !== "undefined" ? globalThis.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

/** Mundane (non-sensitive) web storage — persistent. */
export const webMundane: KeyValueStorage = createWebStorage(safeLocalStorage);

/**
 * "Secure-ish" web storage — sessionStorage. The browser has no real
 * secure storage; cookies with HttpOnly + Secure attrs are the right
 * answer for refresh tokens on web. Use this slot for transient state
 * (CSRF nonces, OAuth `state`).
 */
export const webSecure: KeyValueStorage = createWebStorage(safeSessionStorage);
