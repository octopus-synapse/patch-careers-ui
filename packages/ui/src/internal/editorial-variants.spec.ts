import { editorialPalette, editorialPaletteDark, editorialPalettes } from "@patch-careers/tokens";
import { describe, expect, it } from "vitest";
import {
  resolveConsentBoxColors,
  resolveLabelColor,
  resolveOAuthColors,
  resolveUnderlineColors,
} from "./editorial-variants";

const palettes = [
  ["light", editorialPalette],
  ["dark", editorialPaletteDark],
] as const;

describe.each(palettes)("resolveUnderlineColors (%s)", (_name, p) => {
  it("uses accent + strong hairline when valid", () => {
    expect(resolveUnderlineColors(p, false)).toEqual({
      hairline: p.hairlineStrong,
      focus: p.accent,
    });
  });

  it("uses danger for both when in error", () => {
    expect(resolveUnderlineColors(p, true)).toEqual({ hairline: p.danger, focus: p.danger });
  });
});

describe.each(palettes)("resolveLabelColor (%s)", (_name, p) => {
  it("muted normally, danger on error", () => {
    expect(resolveLabelColor(p, false)).toBe(p.muted);
    expect(resolveLabelColor(p, true)).toBe(p.danger);
  });
});

describe.each(palettes)("resolveOAuthColors (%s)", (_name, p) => {
  it("surface/hairlineStrong at rest", () => {
    expect(resolveOAuthColors(p, false)).toEqual({
      backgroundColor: p.surface,
      borderColor: p.hairlineStrong,
    });
  });

  it("darkens on press", () => {
    expect(resolveOAuthColors(p, true)).toEqual({
      backgroundColor: p.hairline,
      borderColor: p.muted,
    });
  });
});

describe.each(palettes)("resolveConsentBoxColors (%s)", (_name, p) => {
  it("checked wins (primary fill) even with error", () => {
    expect(resolveConsentBoxColors(p, true, true)).toEqual({
      backgroundColor: p.primary,
      borderColor: p.primary,
    });
  });

  it("error border when unchecked + error", () => {
    expect(resolveConsentBoxColors(p, false, true)).toEqual({
      backgroundColor: p.surface,
      borderColor: p.danger,
    });
  });

  it("default border when unchecked + valid", () => {
    expect(resolveConsentBoxColors(p, false, false)).toEqual({
      backgroundColor: p.surface,
      borderColor: p.hairlineStrong,
    });
  });
});

describe("palette wiring", () => {
  it("the dark CTA flips to a light fill", () => {
    const dark = resolveConsentBoxColors(editorialPalettes.dark, true, false);
    expect(dark.backgroundColor).toBe(editorialPaletteDark.primary);
  });
});
