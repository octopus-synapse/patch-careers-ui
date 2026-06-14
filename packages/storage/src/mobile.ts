import type { KeyValueStorage, SetItemOptions } from "./interface";

/**
 * Mobile adapters bound to `react-native-mmkv` (mundane) and
 * `expo-secure-store` (secure). Imports are direct — Metro resolves
 * them at build time on iOS/Android, and on web bundlers this module
 * is never reached because `index.ts` dispatches on runtime.
 *
 * Local `.d.ts` stubs (see `src/types/`) cover typecheck in isolation;
 * apps that consume this package install the real packages as runtime
 * peer dependencies (see `package.json` peerDependencies).
 */

import * as ExpoSecureStore from "expo-secure-store";
import { MMKV } from "react-native-mmkv";

/** The subset of `MMKV` the mundane adapter uses — also implemented by the
 *  in-memory fallback below so the two are interchangeable. */
type MundaneBackend = Pick<MMKV, "getString" | "set" | "delete" | "clearAll" | "getAllKeys">;

/** In-memory stand-in used when MMKV can't initialise (see `mundaneBackend`). */
function createMemoryBackend(): MundaneBackend {
  const map = new Map<string, string>();
  return {
    getString: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, String(value));
    },
    delete: (key) => {
      map.delete(key);
    },
    clearAll: () => {
      map.clear();
    },
    getAllKeys: () => Array.from(map.keys()),
  };
}

let backendSingleton: MundaneBackend | null = null;
function mundaneBackend(): MundaneBackend {
  if (backendSingleton === null) {
    try {
      backendSingleton = new MMKV();
    } catch (error) {
      // react-native-mmkv 3.x requires the New Architecture; on an old-arch
      // binary (e.g. Expo Go) `new MMKV()` throws and would otherwise crash
      // any flow that touches mundane storage (the logout path hits it via the
      // secure-key index). Degrade to an in-memory store so the app stays
      // usable; real persistence resumes on a New-Architecture build.
      console.warn("[storage] MMKV unavailable, falling back to in-memory store:", error);
      backendSingleton = createMemoryBackend();
    }
  }
  return backendSingleton;
}

export const mobileMundane: KeyValueStorage = {
  async getItem(key) {
    const value = mundaneBackend().getString(key);
    return value ?? null;
  },
  async setItem(key, value) {
    mundaneBackend().set(key, value);
  },
  async removeItem(key) {
    mundaneBackend().delete(key);
  },
  async clear() {
    mundaneBackend().clearAll();
  },
  async getAllKeys() {
    return mundaneBackend().getAllKeys();
  },
};

/**
 * Tracks which keys this adapter has written. expo-secure-store has no
 * `getAllKeys` of its own (Keychain enumeration is platform-restricted),
 * so we shadow it with an index stored in MMKV. The index key is
 * namespaced to avoid collisions with consumer keys.
 */
const SECURE_INDEX_KEY = "__patch_careers_secure_index__";

async function readIndex(): Promise<Set<string>> {
  const raw = await mobileMundane.getItem(SECURE_INDEX_KEY);
  if (raw === null) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((v): v is string => typeof v === "string"));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

async function writeIndex(keys: Set<string>): Promise<void> {
  await mobileMundane.setItem(SECURE_INDEX_KEY, JSON.stringify(Array.from(keys)));
}

function secureStoreKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, (char) => `_u${char.charCodeAt(0).toString(16)}_`);
}

export const mobileSecure: KeyValueStorage = {
  async getItem(key) {
    return ExpoSecureStore.getItemAsync(secureStoreKey(key));
  },
  async setItem(key, value, options?: SetItemOptions) {
    await ExpoSecureStore.setItemAsync(secureStoreKey(key), value, {
      ...(options?.requireAuthentication !== undefined
        ? { requireAuthentication: options.requireAuthentication }
        : {}),
    });
    const index = await readIndex();
    index.add(key);
    await writeIndex(index);
  },
  async removeItem(key) {
    await ExpoSecureStore.deleteItemAsync(secureStoreKey(key));
    const index = await readIndex();
    index.delete(key);
    await writeIndex(index);
  },
  async clear() {
    const index = await readIndex();
    await Promise.all(
      Array.from(index).map((k) => ExpoSecureStore.deleteItemAsync(secureStoreKey(k))),
    );
    await writeIndex(new Set());
  },
  async getAllKeys() {
    const index = await readIndex();
    return Array.from(index);
  },
};
