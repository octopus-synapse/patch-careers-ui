import { describe, expect, it } from "vitest";
import { asZustandStorage, zustandJSONStorage } from "./persist";
import { createMemoryStorage } from "./test-helpers";

describe("asZustandStorage", () => {
  it("delegates getItem/setItem/removeItem to the underlying KeyValueStorage", async () => {
    const kv = createMemoryStorage();
    const zs = asZustandStorage(kv);
    await zs.setItem("k", "v");
    expect(await zs.getItem("k")).toBe("v");
    await zs.removeItem("k");
    expect(await zs.getItem("k")).toBeNull();
  });
});

describe("zustandJSONStorage", () => {
  it("returns a storage instance compatible with zustand persist", () => {
    const factory = zustandJSONStorage(createMemoryStorage());
    expect(factory).toBeDefined();
    expect(typeof factory?.getItem).toBe("function");
    expect(typeof factory?.setItem).toBe("function");
    expect(typeof factory?.removeItem).toBe("function");
  });
});
