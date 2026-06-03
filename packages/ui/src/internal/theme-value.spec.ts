import { describe, expect, it } from "vitest";
import { readThemeValue } from "./theme-value";

describe("readThemeValue", () => {
  it("returns a plain string as-is", () => {
    expect(readThemeValue("dark")).toBe("dark");
  });

  it("unwraps a gettable token returning a string", () => {
    expect(readThemeValue({ get: () => "#101010" })).toBe("#101010");
  });

  it("returns undefined when the getter yields a non-string", () => {
    expect(readThemeValue({ get: () => 42 })).toBeUndefined();
  });

  it("returns undefined for null / non-gettable values", () => {
    expect(readThemeValue(null)).toBeUndefined();
    expect(readThemeValue(undefined)).toBeUndefined();
    expect(readThemeValue({})).toBeUndefined();
    expect(readThemeValue(123)).toBeUndefined();
  });
});
