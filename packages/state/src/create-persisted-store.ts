import type { KeyValueStorage } from "@patch-careers/storage";
import { create, type StoreApi } from "zustand";
import { type PersistOptions, persist } from "zustand/middleware";
import { zustandJSONStorage } from "./persist";

/**
 * Shared scaffold for our persisted Zustand stores.
 *
 * Every store splits into a serialisable `data` slice and an `actions`
 * slice. Only `data` is persisted; actions are re-supplied by the
 * initializer on every load, so they survive migrations untouched —
 * `migrate`/`validate` only ever recover the data slice and the default
 * merge keeps the real action implementations from the live store.
 *
 * On rehydration `validate` recovers the persisted slice: return the
 * validated `Data` to hydrate, or `null` to fall back to `initialData`.
 */
export interface PersistedStoreConfig<Data extends object, Actions extends object> {
  /** Storage key — the `name` in the persisted envelope. */
  key: string;
  /** Schema version; bump when the persisted `Data` shape changes. */
  version: number;
  storage: KeyValueStorage;
  /** Defaults for the persisted data slice. */
  initialData: Data;
  /** Build the action slice; receives Zustand's `set`/`get`. */
  createActions: (
    set: StoreApi<Data & Actions>["setState"],
    get: StoreApi<Data & Actions>["getState"],
  ) => Actions;
  /** Recover the persisted data slice, or return `null` to use `initialData`. */
  validate: (persisted: unknown) => Data | null;
}

export function createPersistedStore<Data extends object, Actions extends object>(
  config: PersistedStoreConfig<Data, Actions>,
) {
  const { key, version, storage, initialData, createActions, validate } = config;
  const dataKeys = Object.keys(initialData) as (keyof Data)[];

  const options: PersistOptions<Data & Actions, Data> = {
    name: key,
    version,
    storage: zustandJSONStorage<Data>(storage),
    // Persist only the data slice (functions would be stripped by JSON
    // anyway; being explicit keeps the stored shape and types aligned).
    partialize: (state) => {
      const data = {} as Data;
      for (const dataKey of dataKeys) {
        data[dataKey] = state[dataKey];
      }
      return data;
    },
    migrate: (persisted) => validate(persisted) ?? initialData,
  };

  return create<Data & Actions>()(
    persist((set, get) => ({ ...initialData, ...createActions(set, get) }), options),
  );
}
