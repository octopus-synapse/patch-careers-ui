import { describe, expect, it } from "vitest";
import {
  COLOR_SCHEME_STORE_KEY,
  COLOR_SCHEME_STORE_VERSION,
  createColorSchemeStore,
} from "./color-scheme.store";
import { createMemoryStorage, flushAsync } from "./test-helpers";

describe("createColorSchemeStore", () => {
  it("defaults to system", () => {
    const useStore = createColorSchemeStore(createMemoryStorage());
    expect(useStore.getState().scheme).toBe("system");
  });

  it("setScheme mutates state", () => {
    const useStore = createColorSchemeStore(createMemoryStorage());
    useStore.getState().setScheme("dark");
    expect(useStore.getState().scheme).toBe("dark");
  });

  it("persists scheme changes", async () => {
    const storage = createMemoryStorage();
    const useStore = createColorSchemeStore(storage);
    useStore.getState().setScheme("dark");
    await flushAsync(5);
    const raw = await storage.getItem(COLOR_SCHEME_STORE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}") as { state: { scheme: string }; version: number };
    expect(parsed.state.scheme).toBe("dark");
    expect(parsed.version).toBe(COLOR_SCHEME_STORE_VERSION);
  });

  it("rehydrates from a valid payload", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(
      COLOR_SCHEME_STORE_KEY,
      JSON.stringify({ state: { scheme: "light" }, version: COLOR_SCHEME_STORE_VERSION }),
    );
    const useStore = createColorSchemeStore(storage);
    await flushAsync(5);
    expect(useStore.getState().scheme).toBe("light");
  });

  it("falls back to default on garbage payload", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(
      COLOR_SCHEME_STORE_KEY,
      JSON.stringify({ state: { scheme: "purple" }, version: 0 }),
    );
    const useStore = createColorSchemeStore(storage, "light");
    await flushAsync(5);
    expect(useStore.getState().scheme).toBe("light");
  });
});
