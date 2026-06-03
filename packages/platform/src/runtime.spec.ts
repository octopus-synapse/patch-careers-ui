import { afterEach, describe, expect, it, vi } from "vitest";
import { isReactNativeRuntime, isWebRuntime } from "./runtime";

describe("isReactNativeRuntime", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("is false on a web-like runtime (no RN sentinel)", () => {
    vi.stubGlobal("navigator", { product: "Gecko" });
    expect(isReactNativeRuntime()).toBe(false);
    expect(isWebRuntime()).toBe(true);
  });

  it("is true when navigator.product is ReactNative", () => {
    vi.stubGlobal("navigator", { product: "ReactNative" });
    expect(isReactNativeRuntime()).toBe(true);
    expect(isWebRuntime()).toBe(false);
  });

  it("honours the PATCH_CAREERS_NATIVE=1 env override even on web", () => {
    vi.stubGlobal("navigator", { product: "Gecko" });
    vi.stubEnv("PATCH_CAREERS_NATIVE", "1");
    expect(isReactNativeRuntime()).toBe(true);
  });

  it("treats a missing navigator as web", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isReactNativeRuntime()).toBe(false);
    expect(isWebRuntime()).toBe(true);
  });
});
