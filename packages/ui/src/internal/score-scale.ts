/**
 * score-scale.ts — the single source of truth for how a 0–100 score maps to a
 * tone, a letter grade, and per-surface colors. Every score in the app
 * (resume quality, match, style, profile completeness) resolves through here
 * so the ramp stays consistent.
 *
 * Tone thresholds come from `scoreBand` in `@patch-careers/tokens` — one ramp
 * for the whole product, landing included. They operate on the RAW score so
 * fractional boundaries bucket predictably (84.9 is still "good"):
 *   >= 85   excellent
 *   70..84  good
 *   50..69  fair
 *   <  50   poor
 *
 * The middle band used to resolve to `accent` (a UI blue). It doesn't any
 * more: a score ramp that goes green → blue → amber → red reads as four
 * unrelated states rather than one scale. It now runs green → amber → orange
 * → red, top to bottom.
 *
 * Letter grade mirrors the backend `rankOf()`
 * (notify-resume-quality-rank-change.use-case) exactly:
 *   S >= 90 · A >= 80 · B >= 70 · C >= 60 · D >= 50 · F < 50
 *
 * NOTE the letter and the colour deliberately do NOT share thresholds — 90/80/
 * 70/60/50 against 85/70/50. An 82 is an "A" painted amber. The letter is a
 * contract with the backend's ranking; the colour is a product decision, and
 * reconciling them would mean changing the server's ranks.
 *
 * Two colour resolvers, one ramp. They differ only in palette source:
 *   - chips/pills resolve `intent` tokens (bg/fg pairs for filled pills)
 *   - rings/gauges resolve the editorial palette (stroke colours)
 */

import { intent as intentTokens, scoreBand, scoreRampPalettes } from "@patch-careers/tokens";
import type { Intent, ThemeName } from "./types";

export type ScoreTone = "excellent" | "good" | "fair" | "poor";
export type ScoreGrade = "S" | "A" | "B" | "C" | "D" | "F";

/** Severity of a score issue (quality / match / style), shared across surfaces. */
export type ScoreSeverity = "low" | "medium" | "high";

/**
 * Single source of truth for issue-severity → intent colour, shared by
 * every score breakdown (quality panel, style breakdown, match gaps) so
 * a "medium" dot is the same colour everywhere. Previously the style
 * breakdown used `accent` for medium while the quality panel used `warn`
 * — this reconciles them on `warn`.
 */
export const SCORE_SEVERITY_TO_INTENT: Record<ScoreSeverity, Intent> = {
  high: "danger",
  medium: "warn",
  low: "neutral",
};

/**
 * Clamps an arbitrary number into a valid score window [0, 100] and rounds.
 * Used for display (the number rendered in a ring/chip); thresholding uses
 * the raw value via `scoreTone`/`scoreGrade`.
 */
export function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

export function scoreTone(score: number): ScoreTone {
  return scoreBand(score);
}

export function scoreGrade(score: number): ScoreGrade {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

/**
 * Token intent for chip/pill surfaces. `good` and `fair` both land on `warn`
 * because the intent scale has no orange — the ramp's own orange only exists
 * on the editorial side (`scoreRamp.fair`). Chips therefore compress two
 * bands into one amber; rings keep them apart.
 */
export function toneToIntent(tone: ScoreTone): Intent {
  switch (tone) {
    case "excellent":
      return "success";
    case "good":
      return "warn";
    case "fair":
      return "warn";
    case "poor":
      return "danger";
  }
}

/**
 * Ramp ink for a score — the colour the number, the ring stroke and the bar
 * fill all take.
 *
 * This replaced `toneToEditorialKey`, which resolved a tone into an editorial
 * palette key. That palette has no orange, so the ramp's four bands collapsed
 * into three on every ring and gauge. Reading the ramp directly keeps them
 * apart, and keeps ring colour identical to the demo the design was approved
 * from.
 */
export function scoreInk(score: number, themeName: ThemeName): string {
  return scoreRampPalettes[themeName][scoreBand(score)].ink;
}

/** Ramp wash — the tinted ground behind a score chip or grade square. */
export function scoreWash(score: number, themeName: ThemeName): string {
  return scoreRampPalettes[themeName][scoreBand(score)].wash;
}

export function scoreIntent(score: number): Intent {
  return toneToIntent(scoreTone(score));
}

export function scoreColors(score: number, themeName: ThemeName) {
  return intentTokens[scoreIntent(score)][themeName];
}
