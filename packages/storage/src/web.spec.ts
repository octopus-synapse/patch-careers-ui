import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createWebStorage, webMundane, webSecure } from "./web";

describe("createWebStorage (browser-backed)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const adapter = createWebStorage(() => window.localStorage);

  it("round-trips a value via setItem/getItem", async () => {
    await adapter.setItem("k", "v");
    expect(await adapter.getItem("k")).toBe("v");
  });

  it("returns null for a missing key", async () => {
    expect(await adapter.getItem("nope")).toBeNull();
  });

  it("removeItem deletes a single key", async () => {
    await adapter.setItem("a", "1");
    await adapter.setItem("b", "2");
    await adapter.removeItem("a");
    expect(await adapter.getItem("a")).toBeNull();
    expect(await adapter.getItem("b")).toBe("2");
  });

  it("clear wipes every key", async () => {
    await adapter.setItem("a", "1");
    await adapter.setItem("b", "2");
    await adapter.clear();
    expect(await adapter.getAllKeys()).toEqual([]);
  });

  it("getAllKeys enumerates every key written", async () => {
    await adapter.setItem("alpha", "1");
    await adapter.setItem("beta", "2");
    expect((await adapter.getAllKeys()).sort()).toEqual(["alpha", "beta"]);
  });
});

describe("createWebStorage (memory fallback)", () => {
  const adapter = createWebStorage(() => undefined);

  beforeEach(async () => {
    await adapter.clear();
  });

  it("round-trips in memory when no Storage is provided", async () => {
    await adapter.setItem("k", "v");
    expect(await adapter.getItem("k")).toBe("v");
    expect(await adapter.getAllKeys()).toEqual(["k"]);
  });

  it("removeItem and clear work in memory", async () => {
    await adapter.setItem("a", "1");
    await adapter.setItem("b", "2");
    await adapter.removeItem("a");
    expect(await adapter.getAllKeys()).toEqual(["b"]);
    await adapter.clear();
    expect(await adapter.getAllKeys()).toEqual([]);
  });

  it("getItem returns null on a missing key", async () => {
    expect(await adapter.getItem("nope")).toBeNull();
  });
});

describe("webMundane vs webSecure", () => {
  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("webMundane is isolated from webSecure", async () => {
    await webMundane.setItem("k", "mundane");
    await webSecure.setItem("k", "secure");
    expect(await webMundane.getItem("k")).toBe("mundane");
    expect(await webSecure.getItem("k")).toBe("secure");
  });

  it("clearing one does not affect the other", async () => {
    await webMundane.setItem("k1", "1");
    await webSecure.setItem("k2", "2");
    await webMundane.clear();
    expect(await webMundane.getItem("k1")).toBeNull();
    expect(await webSecure.getItem("k2")).toBe("2");
  });
});
