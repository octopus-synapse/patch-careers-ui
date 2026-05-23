import { describe, expect, it } from "vitest";
import { resolveTextStyle, type TextPreset } from "./text-variants";

describe("resolveTextStyle", () => {
  it("returns distinct styles per preset", () => {
    const presets: TextPreset[] = ["h1", "h2", "h3", "body", "caption", "label", "mono"];
    const sizes = presets.map((p) => resolveTextStyle(p).fontSize);
    // sizes per preset are not all equal
    expect(new Set(sizes).size).toBeGreaterThan(1);
  });

  it("h1 > h2 > h3 > body > caption in fontSize", () => {
    expect(resolveTextStyle("h1").fontSize).toBeGreaterThan(resolveTextStyle("h2").fontSize);
    expect(resolveTextStyle("h2").fontSize).toBeGreaterThan(resolveTextStyle("h3").fontSize);
    expect(resolveTextStyle("h3").fontSize).toBeGreaterThan(resolveTextStyle("body").fontSize);
    expect(resolveTextStyle("body").fontSize).toBeGreaterThan(resolveTextStyle("caption").fontSize);
  });

  it("headings use bold/semibold weight", () => {
    expect(Number(resolveTextStyle("h1").fontWeight)).toBeGreaterThanOrEqual(600);
    expect(Number(resolveTextStyle("h2").fontWeight)).toBeGreaterThanOrEqual(600);
    expect(Number(resolveTextStyle("h3").fontWeight)).toBeGreaterThanOrEqual(600);
  });

  it("body uses regular weight (400)", () => {
    expect(resolveTextStyle("body").fontWeight).toBe("400");
  });

  it("lineHeight is set for every preset", () => {
    const presets: TextPreset[] = ["h1", "h2", "h3", "body", "caption", "label", "mono"];
    for (const p of presets) {
      expect(resolveTextStyle(p).lineHeight).toBeGreaterThan(0);
    }
  });
});
