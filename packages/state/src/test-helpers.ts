import type { KeyValueStorage } from "@patch-careers/storage";

/**
 * Minimal in-memory KeyValueStorage for unit tests. Mirrors the shape
 * of the production web/mobile adapters without depending on jsdom or
 * native modules.
 */
export function createMemoryStorage(): KeyValueStorage & { dump(): Map<string, string> } {
  const map = new Map<string, string>();
  return {
    async getItem(key) {
      return map.get(key) ?? null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
    async removeItem(key) {
      map.delete(key);
    },
    async clear() {
      map.clear();
    },
    async getAllKeys() {
      return Array.from(map.keys());
    },
    dump() {
      return new Map(map);
    },
  };
}

/**
 * Yields control to allow Zustand's persist middleware to flush pending
 * async setItem calls before the test asserts.
 */
export async function flushAsync(times = 3): Promise<void> {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}
