import { describe, expect, it } from "vitest";
import {
  clampScore,
  scoreColors,
  scoreGrade,
  scoreInk,
  scoreIntent,
  scoreTone,
  scoreWash,
  toneToIntent,
} from "./score-scale";

describe("scoreTone", () => {
  it("buckets on the raw score (no rounding at boundaries)", () => {
    expect(scoreTone(100)).toBe("excellent");
    expect(scoreTone(85)).toBe("excellent");
    expect(scoreTone(84.9)).toBe("good");
    expect(scoreTone(70)).toBe("good");
    expect(scoreTone(69.9)).toBe("fair");
    expect(scoreTone(50)).toBe("fair");
    expect(scoreTone(49.9)).toBe("poor");
    expect(scoreTone(0)).toBe("poor");
  });

  it("does not share thresholds with the letter grade", () => {
    // 82 is an "A" painted amber — the letter answers to the backend's
    // rankOf(), the colour to the product ramp. Deliberate.
    expect(scoreGrade(82)).toBe("A");
    expect(scoreTone(82)).toBe("good");
  });
});

describe("scoreGrade", () => {
  it("mirrors the backend rankOf() thresholds", () => {
    expect(scoreGrade(100)).toBe("S");
    expect(scoreGrade(90)).toBe("S");
    expect(scoreGrade(89)).toBe("A");
    expect(scoreGrade(80)).toBe("A");
    expect(scoreGrade(79)).toBe("B");
    expect(scoreGrade(70)).toBe("B");
    expect(scoreGrade(69)).toBe("C");
    expect(scoreGrade(60)).toBe("C");
    expect(scoreGrade(59)).toBe("D");
    expect(scoreGrade(50)).toBe("D");
    expect(scoreGrade(49)).toBe("F");
    expect(scoreGrade(0)).toBe("F");
  });
});

describe("toneToIntent (chips)", () => {
  it("maps each tone to an intent token name", () => {
    expect(toneToIntent("excellent")).toBe("success");
    // The intent scale has no orange, so `good` and `fair` compress onto the
    // same amber here. Rings keep them apart via the ramp — see scoreInk.
    expect(toneToIntent("good")).toBe("warn");
    expect(toneToIntent("fair")).toBe("warn");
    expect(toneToIntent("poor")).toBe("danger");
  });

  it("no longer resolves any band to the UI blue", () => {
    for (const tone of ["excellent", "good", "fair", "poor"] as const) {
      expect(toneToIntent(tone)).not.toBe("accent");
    }
  });
});

describe("scoreInk / scoreWash (rings, bars, chips)", () => {
  it("gives each band its own ink in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const inks = [95, 78, 60, 20].map((v) => scoreInk(v, theme));
      expect(new Set(inks).size).toBe(4);
    }
  });

  it("keeps good and fair apart, which toneToIntent cannot", () => {
    expect(scoreInk(78, "light")).not.toBe(scoreInk(60, "light"));
  });

  it("pairs every ink with a wash", () => {
    expect(scoreWash(95, "light")).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(scoreWash(20, "dark")).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe("scoreIntent", () => {
  it("composes scoreTone + toneToIntent", () => {
    expect(scoreIntent(95)).toBe("success");
    expect(scoreIntent(78)).toBe("warn");
    expect(scoreIntent(60)).toBe("warn");
    expect(scoreIntent(20)).toBe("danger");
  });
});

describe("scoreColors", () => {
  it("yields color tokens for both themes", () => {
    const light = scoreColors(85, "light");
    const dark = scoreColors(85, "dark");
    expect(light.bg).toBeTruthy();
    expect(dark.bg).toBeTruthy();
    expect(light.bg).not.toBe(dark.bg);
  });
});

describe("clampScore", () => {
  it("clamps out-of-range and rounds for display", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(200)).toBe(100);
    expect(clampScore(72.4)).toBe(72);
    expect(clampScore(72.6)).toBe(73);
    expect(clampScore(Number.NaN)).toBe(0);
  });
});
