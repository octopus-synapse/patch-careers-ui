import { describe, expect, it } from "vitest";
import {
  landingAccentPalettes,
  landingAccents,
  landingAccentsDark,
  landingRobot,
  landingRobotDark,
  landingRobotPalettes,
  landingScoreBand,
  landingScoreRamp,
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
