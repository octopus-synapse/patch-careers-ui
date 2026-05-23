import { describe, expect, it } from "vitest";
import { spacing } from "./spacing";

describe("spacing", () => {
  it("is a multiple of 4 for every value (except 0)", () => {
    for (const [key, value] of Object.entries(spacing)) {
      if (value === 0) continue;
      expect(value % 4, `spacing[${key}] should be multiple of 4`).toBe(0);
    }
  });

  it("matches the 4px scale at key landmarks", () => {
    expect(spacing[1]).toBe(4);
    expect(spacing[2]).toBe(8);
    expect(spacing[4]).toBe(16);
    expect(spacing[6]).toBe(24);
    expect(spacing[8]).toBe(32);
    expect(spacing[16]).toBe(64);
    expect(spacing[24]).toBe(96);
  });

  it("starts at 0", () => {
    expect(spacing[0]).toBe(0);
  });

  it("is monotonically increasing", () => {
    const values = Object.values(spacing);
    for (let i = 1; i < values.length; i++) {
      const prev = values[i - 1];
      const curr = values[i];
      if (prev === undefined || curr === undefined) continue;
      expect(curr).toBeGreaterThan(prev);
    }
  });
});
