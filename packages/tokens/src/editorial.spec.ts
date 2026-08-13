import { describe, expect, it } from "vitest";
import {
  editorialOverlays,
  editorialPalette,
  editorialPaletteDark,
  editorialPalettes,
} from "./editorial";

describe("editorialPalette", () => {
  const slots = [
    "bg",
    "surface",
    "panel",
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
    expect(editorialPalette.bg).toBe("#F2F1EC");
    expect(editorialPalette.primary).toBe("#0F172A");
  });

  it("dark keeps the warm dark paper bg and inverts the CTA", () => {
    expect(editorialPaletteDark.bg).toBe("#1A1916");
    expect(editorialPaletteDark.primary).toBe("#F5F5F0");
    expect(editorialPaletteDark.onPrimary).toBe("#1A1916");
  });

  it("panel lifts off the bg in both schemes, and neither hits pure black/white", () => {
    const luminance = (hex: string): number =>
      Number.parseInt(hex.slice(1, 3), 16) +
      Number.parseInt(hex.slice(3, 5), 16) +
      Number.parseInt(hex.slice(5, 7), 16);

    for (const p of [editorialPalette, editorialPaletteDark]) {
      expect(luminance(p.panel)).toBeGreaterThan(luminance(p.bg));
      for (const slot of [p.bg, p.panel]) {
        expect(slot).not.toBe("#FFFFFF");
        expect(slot).not.toBe("#000000");
      }
    }
  });

  it("maps theme names to palettes", () => {
    expect(editorialPalettes.light).toBe(editorialPalette);
    expect(editorialPalettes.dark).toBe(editorialPaletteDark);
  });
});

describe("editorialOverlays", () => {
  const colorSlots = [
    "scrim",
    "glassWash",
    "onGlassInk",
    "onGlassBody",
    "onGlassMuted",
    "onGlassSubtle",
    "onGlassPressed",
    "onGlassHairline",
  ] as const;

  it("covers the same themes as the palettes", () => {
    expect(Object.keys(editorialOverlays).sort()).toEqual(Object.keys(editorialPalettes).sort());
  });

  it("dark mirrors light's slots exactly", () => {
    expect(Object.keys(editorialOverlays.dark).sort()).toEqual(
      Object.keys(editorialOverlays.light).sort(),
    );
  });

  it("every color slot carries alpha — that is the point of this set", () => {
    const rgba = /^rgba\(\d+,\d+,\d+,0?\.\d+\)$/;
    for (const overlays of Object.values(editorialOverlays)) {
      for (const slot of colorSlots) expect(overlays[slot]).toMatch(rgba);
    }
  });

  it("dims harder in dark so the panel separates from an already-dark backdrop", () => {
    const alpha = (c: string): number => Number(c.slice(c.lastIndexOf(",") + 1, -1));
    expect(alpha(editorialOverlays.dark.scrim)).toBeGreaterThan(
      alpha(editorialOverlays.light.scrim),
    );
  });

  it("keeps the glass dark in both schemes — the on-glass ramp depends on it", () => {
    for (const overlays of Object.values(editorialOverlays)) {
      expect(overlays.glassTint).toBe("dark");
      expect(overlays.glassIntensity).toBeGreaterThan(0);
    }
  });
});
