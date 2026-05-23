import { afterEach, describe, expect, it, vi } from "vitest";
import { _getHapticHandler, hapticImpact, setHapticHandler } from "./haptics";

describe("haptics", () => {
  afterEach(() => {
    setHapticHandler(null);
  });

  it("noop when no handler set", () => {
    expect(() => hapticImpact("light")).not.toThrow();
    expect(_getHapticHandler()).toBeNull();
  });

  it("delegates to registered handler", () => {
    const spy = vi.fn();
    setHapticHandler(spy);
    hapticImpact("success");
    expect(spy).toHaveBeenCalledWith("success");
  });

  it("can be unregistered with null", () => {
    const spy = vi.fn();
    setHapticHandler(spy);
    setHapticHandler(null);
    hapticImpact("warning");
    expect(spy).not.toHaveBeenCalled();
  });
});
