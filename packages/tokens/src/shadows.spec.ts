import { describe, expect, it } from "vitest";
import { shadows } from "./shadows";

describe("shadows", () => {
  const names = ["none", "sm", "md", "lg", "xl"] as const;

  it.each(names)("shadows.%s has both web and mobile representations", (name) => {
    const token = shadows[name];
    expect(typeof token.web).toBe("string");
    expect(token.mobile).toMatchObject({
      shadowColor: expect.any(String),
      shadowOffset: { width: expect.any(Number), height: expect.any(Number) },
      shadowOpacity: expect.any(Number),
      shadowRadius: expect.any(Number),
      elevation: expect.any(Number),
    });
  });

  it("`none` is opacity 0 and elevation 0", () => {
    expect(shadows.none.mobile.shadowOpacity).toBe(0);
    expect(shadows.none.mobile.elevation).toBe(0);
    expect(shadows.none.web).toBe("none");
  });

  it("mobile shadowRadius grows monotonically across sm..xl", () => {
    const radii = [shadows.sm, shadows.md, shadows.lg, shadows.xl].map(
      (t) => t.mobile.shadowRadius,
    );
    for (let i = 1; i < radii.length; i++) {
      const prev = radii[i - 1];
      const curr = radii[i];
      if (prev === undefined || curr === undefined) continue;
      expect(curr).toBeGreaterThan(prev);
    }
  });
});
