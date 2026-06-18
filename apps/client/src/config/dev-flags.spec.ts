import { afterEach, describe, expect, it, vi } from "vitest";
import { isDevTestFillEnabled } from "./dev-flags";

describe("isDevTestFillEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is false when the env flag is unset", () => {
    vi.stubGlobal("__DEV__", true);
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_FILL", "");
    expect(isDevTestFillEnabled()).toBe(false);
  });

  it("is false in a release build even when the flag is set (prod-safety)", () => {
    vi.stubGlobal("__DEV__", false);
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_FILL", "true");
    expect(isDevTestFillEnabled()).toBe(false);
  });

  it("is true only in dev with the flag explicitly 'true'", () => {
    vi.stubGlobal("__DEV__", true);
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_FILL", "true");
    expect(isDevTestFillEnabled()).toBe(true);
  });
});
