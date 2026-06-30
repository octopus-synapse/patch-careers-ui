import { describe, expect, it } from "vitest";
import {
  clampScore,
  scoreColors,
  scoreGrade,
  scoreIntent,
  scoreTone,
  toneToEditorialKey,
  toneToIntent,
} from "./score-scale";

describe("scoreTone", () => {
  it("buckets on the raw score (no rounding at boundaries)", () => {
    expect(scoreTone(100)).toBe("excellent");
    expect(scoreTone(80)).toBe("excellent");
    expect(scoreTone(79.9)).toBe("good");
    expect(scoreTone(60)).toBe("good");
    expect(scoreTone(59.9)).toBe("fair");
    expect(scoreTone(40)).toBe("fair");
    expect(scoreTone(39.9)).toBe("poor");
    expect(scoreTone(0)).toBe("poor");
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
    expect(toneToIntent("good")).toBe("accent");
    expect(toneToIntent("fair")).toBe("neutral");
    expect(toneToIntent("poor")).toBe("danger");
  });
});

describe("toneToEditorialKey (rings)", () => {
  it("maps each tone to an editorial palette key (warn, not neutral)", () => {
    expect(toneToEditorialKey("excellent")).toBe("success");
    expect(toneToEditorialKey("good")).toBe("accent");
    expect(toneToEditorialKey("fair")).toBe("warn");
    expect(toneToEditorialKey("poor")).toBe("danger");
  });
});

describe("scoreIntent", () => {
  it("composes scoreTone + toneToIntent", () => {
    expect(scoreIntent(95)).toBe("success");
    expect(scoreIntent(70)).toBe("accent");
    expect(scoreIntent(50)).toBe("neutral");
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
