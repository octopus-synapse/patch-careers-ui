import { editorialPalette as p } from "@patch-careers/tokens";
import { describe, expect, it } from "vitest";
import {
  resolveConsentBoxColors,
  resolveLabelColor,
  resolveOAuthColors,
  resolveUnderlineColors,
} from "./editorial-variants";

describe("resolveUnderlineColors", () => {
  it("uses accent + strong hairline when valid", () => {
    expect(resolveUnderlineColors(false)).toEqual({
      hairline: p.hairlineStrong,
      focus: p.accent,
    });
  });

  it("uses danger for both when in error", () => {
    expect(resolveUnderlineColors(true)).toEqual({ hairline: p.danger, focus: p.danger });
  });
});

describe("resolveLabelColor", () => {
  it("muted normally, danger on error", () => {
    expect(resolveLabelColor(false)).toBe(p.muted);
    expect(resolveLabelColor(true)).toBe(p.danger);
  });
});

describe("resolveOAuthColors", () => {
  it("surface/hairlineStrong at rest", () => {
    expect(resolveOAuthColors(false)).toEqual({
      backgroundColor: p.surface,
      borderColor: p.hairlineStrong,
    });
  });

  it("darkens on press", () => {
    expect(resolveOAuthColors(true)).toEqual({
      backgroundColor: p.hairline,
      borderColor: p.muted,
    });
  });
});

describe("resolveConsentBoxColors", () => {
  it("checked wins (ink fill) even with error", () => {
    expect(resolveConsentBoxColors(true, true)).toEqual({
      backgroundColor: p.primary,
      borderColor: p.primary,
    });
  });

  it("error border when unchecked + error", () => {
    expect(resolveConsentBoxColors(false, true)).toEqual({
      backgroundColor: p.surface,
      borderColor: p.danger,
    });
  });

  it("default border when unchecked + valid", () => {
    expect(resolveConsentBoxColors(false, false)).toEqual({
      backgroundColor: p.surface,
      borderColor: p.hairlineStrong,
    });
  });
});
