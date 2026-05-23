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

let mmkvSingleton: MMKV | null = null;
function mmkv(): MMKV {
  if (mmkvSingleton === null) mmkvSingleton = new MMKV();
  return mmkvSingleton;
}

export const mobileMundane: KeyValueStorage = {
  async getItem(key) {
    const value = mmkv().getString(key);
    return value ?? null;
  },
  async setItem(key, value) {
    mmkv().set(key, value);
  },
  async removeItem(key) {
    mmkv().delete(key);
  },
  async clear() {
    mmkv().clearAll();
  },
  async getAllKeys() {
    return mmkv().getAllKeys();
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

export const mobileSecure: KeyValueStorage = {
  async getItem(key) {
    return ExpoSecureStore.getItemAsync(key);
  },
  async setItem(key, value, options?: SetItemOptions) {
    await ExpoSecureStore.setItemAsync(key, value, {
      ...(options?.requireAuthentication !== undefined
        ? { requireAuthentication: options.requireAuthentication }
        : {}),
    });
    const index = await readIndex();
    index.add(key);
    await writeIndex(index);
  },
  async removeItem(key) {
    await ExpoSecureStore.deleteItemAsync(key);
    const index = await readIndex();
    index.delete(key);
    await writeIndex(index);
  },
  async clear() {
    const index = await readIndex();
    await Promise.all(Array.from(index).map((k) => ExpoSecureStore.deleteItemAsync(k)));
    await writeIndex(new Set());
  },
  async getAllKeys() {
    const index = await readIndex();
    return Array.from(index);
  },
};
