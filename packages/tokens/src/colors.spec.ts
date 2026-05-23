import { describe, expect, it } from "vitest";
import { colors, intent, palette } from "./colors";

describe("palette", () => {
  it("exposes 4 ramps (gray/blue/red/green)", () => {
    expect(Object.keys(palette).sort()).toEqual(["blue", "gray", "green", "red"]);
  });

  it("each ramp has 10 shades (50..900)", () => {
    const expected = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
    for (const ramp of Object.values(palette)) {
      expect(Object.keys(ramp).sort()).toEqual(expected.sort());
    }
  });

  it("all values are valid hex colors", () => {
    const hex = /^#[0-9a-f]{6}$/i;
    for (const ramp of Object.values(palette)) {
      for (const value of Object.values(ramp)) {
        expect(value).toMatch(hex);
      }
    }
  });
});

describe("intent", () => {
  const names = ["neutral", "accent", "danger", "success"] as const;
  const variants = ["light", "dark"] as const;
  const slots = ["bg", "fg", "border", "hoverBg", "pressBg", "subtleBg", "subtleFg"] as const;

  it("exposes 4 intent names", () => {
    expect(Object.keys(intent).sort()).toEqual([...names].sort());
  });

  it.each(names)("intent.%s has light and dark variants", (name) => {
    expect(Object.keys(intent[name]).sort()).toEqual([...variants].sort());
  });

  it.each(names)("intent.%s.light has all required slots", (name) => {
    for (const slot of slots) {
      expect(intent[name].light[slot]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it.each(names)("intent.%s.dark has all required slots", (name) => {
    for (const slot of slots) {
      expect(intent[name].dark[slot]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("danger and accent intents differ between light and dark", () => {
    expect(intent.danger.light.bg).not.toBe(intent.danger.dark.bg);
    expect(intent.accent.light.bg).not.toBe(intent.accent.dark.bg);
  });
});

describe("colors aggregate", () => {
  it("re-exposes palette and intent", () => {
    expect(colors.palette).toBe(palette);
    expect(colors.intent).toBe(intent);
  });
});
