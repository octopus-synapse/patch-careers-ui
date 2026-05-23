import type { KeyValueStorage } from "./interface";

/**
 * Wraps a synchronous browser Storage (localStorage / sessionStorage)
 * behind the async KeyValueStorage contract.
 *
 * In non-browser test environments where Storage is absent, the adapter
 * falls back to an in-memory Map so unit tests do not need jsdom for
 * smoke checks. Tests that explicitly want browser semantics use jsdom.
 */
export function createWebStorage(getBackend: () => Storage | undefined): KeyValueStorage {
  const memoryFallback = new Map<string, string>();
  const backend = (): Storage | Map<string, string> => getBackend() ?? memoryFallback;

  return {
    async getItem(key) {
      const store = backend();
      if (store instanceof Map) return store.get(key) ?? null;
      return store.getItem(key);
    },
    async setItem(key, value) {
      const store = backend();
      if (store instanceof Map) {
        store.set(key, value);
        return;
      }
      store.setItem(key, value);
    },
    async removeItem(key) {
      const store = backend();
      if (store instanceof Map) {
        store.delete(key);
        return;
      }
      store.removeItem(key);
    },
    async clear() {
      const store = backend();
      if (store instanceof Map) {
        store.clear();
        return;
      }
      store.clear();
    },
    async getAllKeys() {
      const store = backend();
      if (store instanceof Map) return Array.from(store.keys());
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k !== null) keys.push(k);
      }
      return keys;
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
