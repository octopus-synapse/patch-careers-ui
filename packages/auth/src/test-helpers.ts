/**
 * Test-only helpers — an in-memory `KeyValueStorage` so spec files
 * don't need to mock `@patch-careers/storage`'s web/mobile adapters.
 */
import type { KeyValueStorage } from "@patch-careers/storage";

export function createMemoryStorage(): KeyValueStorage & {
  readonly store: Map<string, string>;
} {
  const store = new Map<string, string>();
  return {
    store,
    async getItem(key: string) {
      return store.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      store.set(key, value);
    },
    async removeItem(key: string) {
      store.delete(key);
    },
    async clear() {
      store.clear();
    },
    async getAllKeys() {
      return Array.from(store.keys());
    },
  };
}
