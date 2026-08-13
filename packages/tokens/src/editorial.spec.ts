import { describe, expect, it } from "vitest";
import {
  editorialGlass,
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

const RGBA = /^rgba\(\d+,\d+,\d+,0?\.\d+\)$/;

/** Alpha of an `rgba(r,g,b,a)` string — the trailing component. */
const alphaOf = (color: string): number => Number(color.slice(color.lastIndexOf(",") + 1, -1));

describe("editorialOverlays", () => {
  const scrimScale = ["scrimPanel", "scrimDialog", "scrimModal"] as const;

  it("covers the same themes as the palettes", () => {
    expect(Object.keys(editorialOverlays).sort()).toEqual(Object.keys(editorialPalettes).sort());
  });

  it("dark mirrors light's slots exactly", () => {
    expect(Object.keys(editorialOverlays.dark).sort()).toEqual(
      Object.keys(editorialOverlays.light).sort(),
    );
  });

  it("every slot carries alpha — that is the point of this set", () => {
    for (const overlays of Object.values(editorialOverlays)) {
      for (const value of Object.values(overlays)) expect(value).toMatch(RGBA);
    }
  });

  it("deepens the scrim as the surface demands more focus", () => {
    for (const overlays of Object.values(editorialOverlays)) {
      const depths = scrimScale.map((slot) => alphaOf(overlays[slot]));
      expect(depths).toEqual([...depths].sort((a, b) => a - b));
      expect(new Set(depths).size).toBe(depths.length);
    }
  });

  it("dims harder in dark throughout, so a surface separates from dark paper", () => {
    for (const slot of scrimScale) {
      expect(alphaOf(editorialOverlays.dark[slot])).toBeGreaterThan(
        alphaOf(editorialOverlays.light[slot]),
      );
    }
  });

  it("keeps the media scrim scheme-independent — a photo has no light/dark", () => {
    expect(editorialOverlays.dark.scrimMedia).toBe(editorialOverlays.light.scrimMedia);
  });

  it("tracks each scheme's danger red in the destructive wash", () => {
    const rgbOf = (color: string): string =>
      color
        .slice(color.indexOf("(") + 1)
        .split(",", 3)
        .join();
    const asRgb = (hex: string): string =>
      [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)).join();

    expect(rgbOf(editorialOverlays.light.dangerWash)).toBe(asRgb(editorialPalette.danger));
    expect(rgbOf(editorialOverlays.dark.dangerWash)).toBe(asRgb(editorialPaletteDark.danger));
  });
});

describe("editorialGlass", () => {
  it("covers the same themes as the palettes", () => {
    expect(Object.keys(editorialGlass).sort()).toEqual(Object.keys(editorialPalettes).sort());
  });

  it("dark offers the same variants as light", () => {
    expect(Object.keys(editorialGlass.dark).sort()).toEqual(
      Object.keys(editorialGlass.light).sort(),
    );
  });

  it("gives every variant a complete material", () => {
    for (const variants of Object.values(editorialGlass)) {
      for (const material of Object.values(variants)) {
        expect(material.tint).toMatch(/^(light|dark)$/);
        expect(material.intensity).toBeGreaterThan(0);
        expect(material.wash).toMatch(RGBA);
      }
    }
  });

  it("keeps `ink` black in both schemes — the on-glass ramp depends on it", () => {
    for (const variants of Object.values(editorialGlass)) {
      expect(variants.ink.tint).toBe("dark");
    }
  });
});
