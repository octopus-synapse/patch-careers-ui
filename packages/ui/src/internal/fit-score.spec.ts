import { describe, expect, it } from "vitest";
import { clampScore, fitScoreBucket, fitScoreColors, fitScoreIntent } from "./fit-score";

describe("fitScoreBucket", () => {
  it("buckets boundary values correctly", () => {
    expect(fitScoreBucket(100)).toBe("excellent");
    expect(fitScoreBucket(80)).toBe("excellent");
    expect(fitScoreBucket(79.9)).toBe("good");
    expect(fitScoreBucket(60)).toBe("good");
    expect(fitScoreBucket(59.9)).toBe("fair");
    expect(fitScoreBucket(40)).toBe("fair");
    expect(fitScoreBucket(39.9)).toBe("poor");
    expect(fitScoreBucket(0)).toBe("poor");
  });
});

describe("fitScoreIntent", () => {
  it("maps buckets to intents", () => {
    expect(fitScoreIntent(95)).toBe("success");
    expect(fitScoreIntent(70)).toBe("accent");
    expect(fitScoreIntent(50)).toBe("neutral");
    expect(fitScoreIntent(20)).toBe("danger");
  });
});

describe("fitScoreColors", () => {
  it("yields color tokens for both themes", () => {
    const light = fitScoreColors(85, "light");
    const dark = fitScoreColors(85, "dark");
    expect(light.bg).toBeTruthy();
    expect(dark.bg).toBeTruthy();
    expect(light.bg).not.toBe(dark.bg);
  });
});

describe("clampScore", () => {
  it("clamps below 0 to 0 and above 100 to 100", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(200)).toBe(100);
  });

  it("rounds to integer", () => {
    expect(clampScore(72.4)).toBe(72);
    expect(clampScore(72.6)).toBe(73);
  });

  it("turns NaN into 0", () => {
    expect(clampScore(Number.NaN)).toBe(0);
  });
});
