import { describe, expect, it } from "vitest";
import { createLocaleStore, LOCALE_STORE_KEY, LOCALE_STORE_VERSION } from "./locale.store";
import { createMemoryStorage, flushAsync } from "./test-helpers";

describe("createLocaleStore", () => {
  it("defaults to pt-BR", () => {
    const storage = createMemoryStorage();
    const useStore = createLocaleStore(storage);
    expect(useStore.getState().locale).toBe("pt-BR");
  });

  it("can override the default", () => {
    const storage = createMemoryStorage();
    const useStore = createLocaleStore(storage, "en");
    expect(useStore.getState().locale).toBe("en");
  });

  it("setLocale mutates the in-memory state", () => {
    const storage = createMemoryStorage();
    const useStore = createLocaleStore(storage);
    useStore.getState().setLocale("en");
    expect(useStore.getState().locale).toBe("en");
  });

  it("persists changes through the storage adapter", async () => {
    const storage = createMemoryStorage();
    const useStore = createLocaleStore(storage);
    useStore.getState().setLocale("en");
    await flushAsync(5);
    const dumped = await storage.getItem(LOCALE_STORE_KEY);
    expect(dumped).not.toBeNull();
    const parsed = JSON.parse(dumped ?? "{}") as { state: { locale: string }; version: number };
    expect(parsed.state.locale).toBe("en");
    expect(parsed.version).toBe(LOCALE_STORE_VERSION);
  });

  it("rehydrates from an existing payload", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(
      LOCALE_STORE_KEY,
      JSON.stringify({ state: { locale: "en" }, version: LOCALE_STORE_VERSION }),
    );
    const useStore = createLocaleStore(storage);
    await flushAsync(5);
    expect(useStore.getState().locale).toBe("en");
  });

  it("falls back to default when persisted locale is unknown", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(
      LOCALE_STORE_KEY,
      JSON.stringify({ state: { locale: "xx-YY" }, version: 0 }),
    );
    const useStore = createLocaleStore(storage, "en");
    await flushAsync(5);
    expect(useStore.getState().locale).toBe("en");
  });
});
