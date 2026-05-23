import { describe, expect, it } from "vitest";
import { resolveSkeletonDimensions } from "./skeleton";

describe("resolveSkeletonDimensions", () => {
  it("text variant defaults to 100% width / 14h", () => {
    const d = resolveSkeletonDimensions("text");
    expect(d.width).toBe("100%");
    expect(d.height).toBe(14);
  });

  it("avatar variant defaults to 40x40 with full radius", () => {
    const d = resolveSkeletonDimensions("avatar");
    expect(d.width).toBe(40);
    expect(d.height).toBe(40);
    expect(d.borderRadius).toBeGreaterThan(100);
  });

  it("rect variant uses md radius", () => {
    const d = resolveSkeletonDimensions("rect");
    expect(d.borderRadius).toBe(8);
  });

  it("circle uses width for both dimensions", () => {
    const d = resolveSkeletonDimensions("circle", 64);
    expect(d.width).toBe(64);
    expect(d.height).toBe(64);
  });

  it("respects explicit width/height overrides", () => {
    const d = resolveSkeletonDimensions("rect", 200, 50);
    expect(d.width).toBe(200);
    expect(d.height).toBe(50);
  });
});
