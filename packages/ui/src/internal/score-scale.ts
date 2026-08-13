/**
 * score-scale.ts — the single source of truth for how a 0–100 score maps to a
 * tone, a letter grade, and per-surface colors. Every score in the app
 * (resume quality, match, style, profile completeness) resolves through here
 * so the ramp stays consistent.
 *
 * Tone thresholds (product taxonomy D9–D12) — operate on the RAW score so
 * fractional boundaries bucket predictably (79.9 is still "good"):
 *   >= 80   excellent
 *   60..79  good
 *   40..59  fair
 *   <  40   poor
 *
 * Letter grade mirrors the backend `rankOf()`
 * (notify-resume-quality-rank-change.use-case) exactly:
 *   S >= 90 · A >= 80 · B >= 70 · C >= 60 · D >= 50 · F < 50
 *
 * Two color resolvers, one ramp: both now map "fair" to amber `warn` so a
 * score is the same colour on a chip as on a ring. They differ only in
 * palette source:
 *   - chips/pills resolve `intent` tokens (bg/fg pairs for filled pills)
 *   - rings/gauges resolve the editorial palette (stroke colours)
 */

import { intent as intentTokens } from "@patch-careers/tokens";
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

/** Editorial-palette color key a tone resolves to on ring/gauge surfaces. */
export type EditorialToneKey = "success" | "accent" | "warn" | "danger";

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
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

export function scoreGrade(score: number): ScoreGrade {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

/** Token intent for chip/pill surfaces. Now that `intent` exposes an
 * amber `warn`, the "fair" band resolves to the SAME amber the ring/gauge
 * uses via `toneToEditorialKey` — chips and rings finally agree. */
export function toneToIntent(tone: ScoreTone): Intent {
  switch (tone) {
    case "excellent":
      return "success";
    case "good":
      return "accent";
    case "fair":
      return "warn";
    case "poor":
      return "danger";
  }
}

/** Editorial palette key for ring/gauge surfaces (uses `warn`, not `neutral`). */
export function toneToEditorialKey(tone: ScoreTone): EditorialToneKey {
  switch (tone) {
    case "excellent":
      return "success";
    case "good":
      return "accent";
    case "fair":
      return "warn";
    case "poor":
      return "danger";
  }
}

export function scoreIntent(score: number): Intent {
  return toneToIntent(scoreTone(score));
}

export function scoreColors(score: number, themeName: ThemeName) {
  return intentTokens[scoreIntent(score)][themeName];
}
