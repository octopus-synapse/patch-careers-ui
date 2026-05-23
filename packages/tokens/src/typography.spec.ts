import { describe, expect, it } from "vitest";
import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  typography,
} from "./typography";

describe("typography.fontFamily", () => {
  it("provides heading/body/mono placeholders", () => {
    expect(fontFamily.heading).toBe("System");
    expect(fontFamily.body).toBe("System");
    expect(fontFamily.mono).toBe("System");
  });
});

describe("typography.fontSize", () => {
  it("scale spans the expected range", () => {
    expect(fontSize.xs).toBe(12);
    expect(fontSize.md).toBe(16);
    expect(fontSize["6xl"]).toBe(48);
  });

  it("every size is a positive number", () => {
    for (const value of Object.values(fontSize)) {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe("typography.fontWeight", () => {
  it("maps semantic names to numeric strings", () => {
    expect(fontWeight.regular).toBe("400");
    expect(fontWeight.medium).toBe("500");
    expect(fontWeight.semibold).toBe("600");
    expect(fontWeight.bold).toBe("700");
  });
});

describe("typography.lineHeight", () => {
  it("matches every fontSize key", () => {
    expect(Object.keys(lineHeight).sort()).toEqual(Object.keys(fontSize).sort());
  });

  it("each line-height is >= its fontSize", () => {
    for (const key of Object.keys(fontSize) as Array<keyof typeof fontSize>) {
      expect(lineHeight[key]).toBeGreaterThanOrEqual(fontSize[key]);
    }
  });
});

describe("typography.letterSpacing", () => {
  it("provides tight/normal/wide", () => {
    expect(letterSpacing.tight).toBeLessThan(0);
    expect(letterSpacing.normal).toBe(0);
    expect(letterSpacing.wide).toBeGreaterThan(0);
  });
});

describe("typography aggregate", () => {
  it("re-exposes nested groups", () => {
    expect(typography.fontFamily).toBe(fontFamily);
    expect(typography.fontSize).toBe(fontSize);
    expect(typography.fontWeight).toBe(fontWeight);
    expect(typography.lineHeight).toBe(lineHeight);
    expect(typography.letterSpacing).toBe(letterSpacing);
  });
});
