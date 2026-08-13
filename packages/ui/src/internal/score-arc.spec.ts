import { describe, expect, it } from "vitest";
import { arcDashOffset, scoreArcGeometry } from "./score-arc";

describe("scoreArcGeometry", () => {
  it("insets the radius by half the stroke width", () => {
    const { center, r, circumference } = scoreArcGeometry(64, 8);
    expect(center).toBe(32);
    expect(r).toBe(28); // (64 - 8) / 2
    expect(circumference).toBeCloseTo(2 * Math.PI * 28, 6);
  });
});

describe("arcDashOffset", () => {
  it("is the full circumference at 0% and zero at 100%", () => {
    const c = 100;
    expect(arcDashOffset(c, 0)).toBe(100);
    expect(arcDashOffset(c, 1)).toBe(0);
    expect(arcDashOffset(c, 0.25)).toBe(75);
  });

  it("clamps out-of-range fractions", () => {
    expect(arcDashOffset(100, -1)).toBe(100);
    expect(arcDashOffset(100, 2)).toBe(0);
  });
});
