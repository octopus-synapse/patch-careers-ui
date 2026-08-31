import { describe, expect, it } from "vitest";
import {
  landingAccentPalettes,
  landingAccents,
  landingAccentsDark,
  landingBrandFace,
  landingBrandFaceDark,
  landingBrandFacePalettes,
  landingMascotLegs,
  landingMascotLegsDark,
  landingMascotLegsPalettes,
  landingRobot,
  landingRobotDark,
  landingRobotPalettes,
  landingScoreBand,
  landingScoreRamp,
  landingScoreRampDark,
  landingScoreRampPalettes,
} from "./landing";

const HEX = /^#[0-9A-F]{6}$/;

describe("landingAccents", () => {
  const keys = ["ink", "blush", "indigo", "mint", "amber", "violet"] as const;

  it("exposes every chapter accent", () => {
    expect(Object.keys(landingAccents).sort()).toEqual([...keys].sort());
  });

  it("dark accents mirror the light keys exactly", () => {
    expect(Object.keys(landingAccentsDark).sort()).toEqual(Object.keys(landingAccents).sort());
  });

  it("every accent carries both an ink and a wash", () => {
    for (const set of [landingAccents, landingAccentsDark]) {
      for (const value of Object.values(set)) {
        expect(Object.keys(value).sort()).toEqual(["accent", "soft"]);
      }
    }
  });

  it("all values are opaque 6-digit hex in both schemes", () => {
    for (const set of [landingAccents, landingAccentsDark]) {
      for (const { accent, soft } of Object.values(set)) {
        expect(accent).toMatch(HEX);
        expect(soft).toMatch(HEX);
      }
    }
  });

  it("is reachable by theme name", () => {
    expect(landingAccentPalettes.light).toBe(landingAccents);
    expect(landingAccentPalettes.dark).toBe(landingAccentsDark);
  });

  it("keeps the brand indigo distinct from the editorial UI accent", () => {
    // The landing speaks in the brand mark's blue, not the focus-ring blue.
    expect(landingAccents.indigo.accent).toBe("#5766E8");
  });
});

describe("landingRobot", () => {
  it("dark palette mirrors the light slots exactly", () => {
    expect(Object.keys(landingRobotDark).sort()).toEqual(Object.keys(landingRobot).sort());
  });

  it("all values are opaque 6-digit hex in both schemes", () => {
    for (const set of [landingRobot, landingRobotDark]) {
      for (const value of Object.values(set)) {
        expect(value).toMatch(HEX);
      }
    }
  });

  it("is reachable by theme name", () => {
    expect(landingRobotPalettes.light).toBe(landingRobot);
    expect(landingRobotPalettes.dark).toBe(landingRobotDark);
  });
});

describe("landingScoreRamp", () => {
  it("all values are opaque 6-digit hex", () => {
    for (const { ink, wash } of Object.values(landingScoreRamp)) {
      expect(ink).toMatch(HEX);
      expect(wash).toMatch(HEX);
    }
  });

  it("bands values on the prototype's thresholds", () => {
    expect(landingScoreBand(89)).toBe("excellent");
    expect(landingScoreBand(85)).toBe("excellent");
    expect(landingScoreBand(84)).toBe("good");
    expect(landingScoreBand(70)).toBe("good");
    expect(landingScoreBand(69)).toBe("fair");
    expect(landingScoreBand(50)).toBe("fair");
    expect(landingScoreBand(49)).toBe("poor");
  });
});

describe("landingScoreRamp dark", () => {
  it("dark ramp mirrors the light bands exactly", () => {
    expect(Object.keys(landingScoreRampDark).sort()).toEqual(Object.keys(landingScoreRamp).sort());
  });

  it("all dark values are opaque 6-digit hex", () => {
    for (const { ink, wash } of Object.values(landingScoreRampDark)) {
      expect(ink).toMatch(HEX);
      expect(wash).toMatch(HEX);
    }
  });

  it("is reachable by theme name", () => {
    expect(landingScoreRampPalettes.light).toBe(landingScoreRamp);
    expect(landingScoreRampPalettes.dark).toBe(landingScoreRampDark);
  });
});

describe("landingBrandFace", () => {
  it("dark face mirrors the light slots exactly", () => {
    expect(Object.keys(landingBrandFaceDark).sort()).toEqual(Object.keys(landingBrandFace).sort());
  });

  it("all values are opaque 6-digit hex in both schemes", () => {
    for (const set of [landingBrandFace, landingBrandFaceDark]) {
      for (const value of Object.values(set)) {
        expect(value).toMatch(HEX);
      }
    }
  });

  it("is reachable by theme name", () => {
    expect(landingBrandFacePalettes.light).toBe(landingBrandFace);
    expect(landingBrandFacePalettes.dark).toBe(landingBrandFaceDark);
  });
});

describe("landingMascotLegs", () => {
  it("dark legs mirror the light sides and slots exactly", () => {
    expect(Object.keys(landingMascotLegsDark).sort()).toEqual(
      Object.keys(landingMascotLegs).sort(),
    );
    for (const side of ["left", "right"] as const) {
      expect(Object.keys(landingMascotLegsDark[side]).sort()).toEqual(
        Object.keys(landingMascotLegs[side]).sort(),
      );
    }
  });

  it("every slot is a non-empty color in both schemes (hex or rgba outline)", () => {
    // Outlines legitimately use rgba(...) — validate shape, not the hex regex.
    const COLOR = /^(#[0-9A-F]{6}|rgba\(\d+,\d+,\d+,0?\.\d+\))$/;
    for (const set of [landingMascotLegs, landingMascotLegsDark]) {
      for (const side of Object.values(set)) {
        for (const value of Object.values(side)) {
          expect(value).toMatch(COLOR);
        }
      }
    }
  });

  it("is reachable by theme name", () => {
    expect(landingMascotLegsPalettes.light).toBe(landingMascotLegs);
    expect(landingMascotLegsPalettes.dark).toBe(landingMascotLegsDark);
  });
});
