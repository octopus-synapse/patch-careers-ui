import { describe, expect, it } from "vitest";
import { createPersistedStore } from "./create-persisted-store";
import { createMemoryStorage, flushAsync } from "./test-helpers";

interface CounterData {
  count: number;
}
interface CounterActions {
  inc: () => void;
  setCount: (n: number) => void;
}

const KEY = "test:counter";

function makeStore(storage = createMemoryStorage(), initial = 0) {
  return createPersistedStore<CounterData, CounterActions>({
    key: KEY,
    version: 1,
    storage,
    initialData: { count: initial },
    createActions: (set, get) => ({
      inc: () => set({ count: get().count + 1 }),
      setCount: (n) => set({ count: n }),
    }),
    validate: (persisted) => {
      if (
        persisted !== null &&
        typeof persisted === "object" &&
        "count" in persisted &&
        typeof (persisted as { count: unknown }).count === "number"
      ) {
        return { count: (persisted as { count: number }).count };
      }
      return null;
    },
  });
}

describe("createPersistedStore", () => {
  it("seeds from initialData and runs actions", () => {
    const store = makeStore();
    expect(store.getState().count).toBe(0);
    store.getState().inc();
    expect(store.getState().count).toBe(1);
    store.getState().setCount(9);
    expect(store.getState().count).toBe(9);
  });

  it("persists only the data slice (no action functions)", async () => {
    const storage = createMemoryStorage();
    const store = makeStore(storage);
    store.getState().setCount(5);
    await flushAsync(5);
    const raw = await storage.getItem(KEY);
    const parsed = JSON.parse(raw ?? "{}") as { state: Record<string, unknown>; version: number };
    expect(parsed.state).toEqual({ count: 5 });
    expect(parsed.version).toBe(1);
  });

  it("rehydrates a valid persisted slice", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(KEY, JSON.stringify({ state: { count: 7 }, version: 1 }));
    const store = makeStore(storage);
    await flushAsync(5);
    expect(store.getState().count).toBe(7);
  });

  it("falls back to initialData when validate rejects the payload", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(KEY, JSON.stringify({ state: { count: "nope" }, version: 0 }));
    const store = makeStore(storage, 3);
    await flushAsync(5);
    expect(store.getState().count).toBe(3);
  });

  it("keeps the real actions after a migration runs (no stub clobber)", async () => {
    const storage = createMemoryStorage();
    // version 0 !== 1 forces `migrate` to run on rehydration.
    await storage.setItem(KEY, JSON.stringify({ state: { count: 2 }, version: 0 }));
    const store = makeStore(storage);
    await flushAsync(5);
    expect(store.getState().count).toBe(2);
    store.getState().inc();
    expect(store.getState().count).toBe(3);
  });
});
