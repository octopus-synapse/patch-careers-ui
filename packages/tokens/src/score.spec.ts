import { describe, expect, it } from "vitest";
import { landingScoreBand, landingScoreRamp } from "./landing";
import { type ScoreBand, scoreBand, scoreRamp, scoreRampDark, scoreRampPalettes } from "./score";

const HEX = /^#[0-9A-F]{6}$/i;
const BANDS: ScoreBand[] = ["excellent", "good", "fair", "poor"];

describe("scoreBand", () => {
  it("buckets on the raw score, so fractional boundaries fall predictably", () => {
    expect(scoreBand(100)).toBe("excellent");
    expect(scoreBand(85)).toBe("excellent");
    expect(scoreBand(84.9)).toBe("good");
    expect(scoreBand(70)).toBe("good");
    expect(scoreBand(69.9)).toBe("fair");
    expect(scoreBand(50)).toBe("fair");
    expect(scoreBand(49.9)).toBe("poor");
    expect(scoreBand(0)).toBe("poor");
  });
});

describe("scoreRamp", () => {
  it("covers every band in both themes", () => {
    expect(Object.keys(scoreRamp).sort()).toEqual([...BANDS].sort());
    expect(Object.keys(scoreRampDark).sort()).toEqual([...BANDS].sort());
  });

  it("keeps every value an opaque 6-digit hex", () => {
    for (const ramp of [scoreRamp, scoreRampDark]) {
      for (const { ink, wash } of Object.values(ramp)) {
        expect(ink).toMatch(HEX);
        expect(wash).toMatch(HEX);
      }
    }
  });

  it("gives each band a distinct ink, so the four never collapse", () => {
    for (const theme of ["light", "dark"] as const) {
      const inks = BANDS.map((b) => scoreRampPalettes[theme][b].ink);
      expect(new Set(inks).size).toBe(BANDS.length);
    }
  });

  it("repaints for dark rather than reusing the light values", () => {
    for (const band of BANDS) {
      expect(scoreRamp[band].ink).not.toBe(scoreRampDark[band].ink);
      expect(scoreRamp[band].wash).not.toBe(scoreRampDark[band].wash);
    }
  });
});

describe("landing aliases", () => {
  it("still resolve to the shared ramp after the move out of landing.ts", () => {
    expect(landingScoreRamp).toBe(scoreRamp);
    expect(landingScoreBand(84)).toBe(scoreBand(84));
  });
});
