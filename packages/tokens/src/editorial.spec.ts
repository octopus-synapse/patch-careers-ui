import { describe, expect, it } from "vitest";
import { editorialPalette, editorialPaletteDark, editorialPalettes } from "./editorial";

describe("editorialPalette", () => {
  const slots = [
    "bg",
    "surface",
    "ink",
    "body",
    "muted",
    "subtle",
    "hairline",
    "hairlineStrong",
    "accent",
    "accentDeep",
    "primary",
    "primaryPress",
    "onPrimary",
    "danger",
    "success",
    "warn",
    "fair",
  ] as const;

  it("exposes every editorial slot", () => {
    expect(Object.keys(editorialPalette).sort()).toEqual([...slots].sort());
  });

  it("dark palette mirrors the light palette's slots exactly", () => {
    expect(Object.keys(editorialPaletteDark).sort()).toEqual(Object.keys(editorialPalette).sort());
  });

  it("all values are valid hex colors in both palettes", () => {
    const hex = /^#[0-9a-f]{6}$/i;
    for (const palette of Object.values(editorialPalettes)) {
      for (const value of Object.values(palette)) {
        expect(value).toMatch(hex);
      }
    }
  });

  it("keeps the warm paper bg and deep-ink primary", () => {
    expect(editorialPalette.bg).toBe("#FAFAF6");
    expect(editorialPalette.primary).toBe("#0F172A");
  });

  it("dark keeps the warm dark paper bg and inverts the CTA", () => {
    expect(editorialPaletteDark.bg).toBe("#161512");
    expect(editorialPaletteDark.primary).toBe("#F5F5F0");
    expect(editorialPaletteDark.onPrimary).toBe("#161512");
  });

  it("maps theme names to palettes", () => {
    expect(editorialPalettes.light).toBe(editorialPalette);
    expect(editorialPalettes.dark).toBe(editorialPaletteDark);
  });
});
