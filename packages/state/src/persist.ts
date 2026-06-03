import type { KeyValueStorage } from "@patch-careers/storage";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

/**
 * Bridges our async `KeyValueStorage` to Zustand's `StateStorage`
 * shape. Zustand's persist middleware happily accepts async storage —
 * the wrapper returns Promises directly. `createJSONStorage` then
 * handles JSON (de)serialization plus the versioned envelope used by
 * the `migrate` option on each store.
 */
export function asZustandStorage(storage: KeyValueStorage): StateStorage {
  return {
    getItem: (name) => storage.getItem(name),
    setItem: (name, value) => storage.setItem(name, value),
    removeItem: (name) => storage.removeItem(name),
  };
}

export function zustandJSONStorage<S = unknown>(storage: KeyValueStorage) {
  return createJSONStorage<S>(() => asZustandStorage(storage));
}
