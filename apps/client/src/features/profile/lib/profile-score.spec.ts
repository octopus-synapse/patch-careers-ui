import { describe, expect, it } from "vitest";
import type { MeScores } from "../hooks/use-me-scores";
import { hasProfileScore, profileScoreAverage, profileScoreParts } from "./profile-score";

const scores = (overrides: Partial<MeScores>): MeScores =>
  ({
    resumeId: "r1",
    rank: "B",
    readiness: { score: 41, rank: "F", factors: {}, trend: [] },
    quality: null,
    style: null,
    fit: { status: "never", expiresAt: null },
    ...overrides,
  }) as MeScores;

const quality = (score: number, content: number | null, completeness: number) =>
  ({
    score,
    rank: "B",
    contentQualityScore: content,
    completenessScore: completeness,
    computedAt: "",
    trend: [],
  }) as MeScores["quality"];

describe("profileScoreParts", () => {
  it("maps the four numbers the page shows", () => {
    const parts = profileScoreParts(
      scores({ style: { score: 82, rank: "A" }, quality: quality(74, 68, 83) }),
    );
    expect(parts).toEqual({ style: 82, quality: 74, content: 68, completeness: 83 });
  });

  it("reads a null content score as null rather than zero", () => {
    const parts = profileScoreParts(scores({ quality: quality(83, null, 83) }));
    expect(parts.content).toBeNull();
    expect(parts.completeness).toBe(83);
  });

  it("returns all nulls when there are no scores at all", () => {
    expect(profileScoreParts(undefined)).toEqual({
      style: null,
      quality: null,
      content: null,
      completeness: null,
    });
  });
});

describe("profileScoreAverage", () => {
  it("averages the two top scores, not the sub-scores", () => {
    const parts = profileScoreParts(
      scores({ style: { score: 82, rank: "A" }, quality: quality(74, 68, 83) }),
    );
    expect(profileScoreAverage(parts)).toBe(78);
  });

  it("ignores readiness, which weighs things this page does not show", () => {
    const meScores = scores({
      readiness: { score: 41, rank: "F", factors: {}, trend: [] },
      style: { score: 82, rank: "A" },
      quality: quality(74, 68, 83),
    } as Partial<MeScores>);
    expect(profileScoreAverage(profileScoreParts(meScores))).not.toBe(41);
  });

  it("falls back to the single score that exists", () => {
    expect(
      profileScoreAverage({ style: 90, quality: null, content: null, completeness: null }),
    ).toBe(90);
    expect(
      profileScoreAverage({ style: null, quality: 60, content: null, completeness: null }),
    ).toBe(60);
  });

  it("returns null when neither top score exists", () => {
    expect(
      profileScoreAverage({ style: null, quality: null, content: 70, completeness: 80 }),
    ).toBeNull();
  });

  it("rounds rather than emitting a fraction", () => {
    expect(profileScoreAverage({ style: 82, quality: 75, content: null, completeness: null })).toBe(
      79,
    );
  });
});

describe("hasProfileScore", () => {
  it("is false before anything is scored, so the card can stay hidden", () => {
    expect(hasProfileScore(profileScoreParts(undefined))).toBe(false);
  });

  it("is true as soon as one top score lands", () => {
    expect(hasProfileScore(profileScoreParts(scores({ style: { score: 50, rank: "D" } })))).toBe(
      true,
    );
  });
});
