/**
 * secureStorage — localStorage wrapper that namespaces every key by the
 * current user id. Prevents PII written by user A from leaking into the
 * session of user B (relevant on shared devices or when logout is fast
 * enough that the new session loads before the old draft expires).
 *
 * Logout flow must call clearForUser(previousUserId) to wipe all entries
 * that belong to the user who just signed out.
 */

const NAMESPACE = 'secure';
const ANON = 'anon';

export interface SecureStorage {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clearForCurrentUser(): void;
}

function storageKey(userId: string | undefined, key: string): string {
  return `${NAMESPACE}:${userId ?? ANON}:${key}`;
}

function prefixFor(userId: string | undefined): string {
  return `${NAMESPACE}:${userId ?? ANON}:`;
}

export function createSecureStorage(getUserId: () => string | undefined): SecureStorage {
  return {
    get<T>(key: string): T | undefined {
      if (typeof window === 'undefined') return undefined;
      try {
        const raw = window.localStorage.getItem(storageKey(getUserId(), key));
        if (raw === null) return undefined;
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    },
    set<T>(key: string, value: T): void {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(storageKey(getUserId(), key), JSON.stringify(value));
      } catch {
        // ignore quota / serialization errors
      }
    },
    remove(key: string): void {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.removeItem(storageKey(getUserId(), key));
      } catch {
        // ignore
      }
    },
    clearForCurrentUser(): void {
      clearForUser(getUserId());
    },
  };
}

/**
 * Wipe every entry whose key matches the user's prefix. Call on logout
 * (before the auth state actually clears so getUserId() still returns
 * the outgoing user's id) to remove drafts, cached PII, etc.
 */
export function clearForUser(userId: string | undefined): void {
  if (typeof window === 'undefined') return;
  const prefix = prefixFor(userId);
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    for (const k of toRemove) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
