import { describe, expect, it } from "vitest";
import { radius } from "./radius";

describe("radius", () => {
  it("has the canonical ramp", () => {
    expect(radius.none).toBe(0);
    expect(radius.sm).toBe(4);
    expect(radius.md).toBe(8);
    expect(radius.lg).toBe(12);
    expect(radius.xl).toBe(16);
    expect(radius["2xl"]).toBe(20);
    expect(radius.full).toBe(9999);
  });

  it("`full` is high enough to pill any UI element", () => {
    expect(radius.full).toBeGreaterThanOrEqual(9999);
  });
});
