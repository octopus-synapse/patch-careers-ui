import { describe, expect, it } from "vitest";
import type { KeyValueStorage } from "./interface";
import { createWebStorage } from "./web";

/**
 * Contract test — runs the same expectations against any adapter that
 * implements `KeyValueStorage`. We use the in-memory webStorage as the
 * canonical reference; the mobile adapters are tested in apps/app once
 * Expo is wired (PR #6) because they require native modules.
 */
function runContract(name: string, factory: () => KeyValueStorage) {
  describe(`KeyValueStorage contract: ${name}`, () => {
    it("starts empty", async () => {
      const s = factory();
      expect(await s.getAllKeys()).toEqual([]);
    });

    it("setItem then getItem round-trips", async () => {
      const s = factory();
      await s.setItem("foo", "bar");
      expect(await s.getItem("foo")).toBe("bar");
    });

    it("overwriting a key replaces the value", async () => {
      const s = factory();
      await s.setItem("k", "v1");
      await s.setItem("k", "v2");
      expect(await s.getItem("k")).toBe("v2");
    });

    it("removeItem makes getItem return null", async () => {
      const s = factory();
      await s.setItem("k", "v");
      await s.removeItem("k");
      expect(await s.getItem("k")).toBeNull();
    });

    it("clear removes every key", async () => {
      const s = factory();
      await s.setItem("a", "1");
      await s.setItem("b", "2");
      await s.clear();
      expect(await s.getAllKeys()).toEqual([]);
    });
  });
}

runContract("in-memory web fallback", () => createWebStorage(() => undefined));
