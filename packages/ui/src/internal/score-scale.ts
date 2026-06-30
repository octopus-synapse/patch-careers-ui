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
 * Two color resolvers because the two surfaces draw from different palettes:
 *   - chips/pills resolve `intent` tokens (which expose `neutral`, not `warn`)
 *   - rings/gauges resolve the editorial palette (which exposes `warn`)
 */

import { intent as intentTokens } from "@patch-careers/tokens";
import type { Intent, ThemeName } from "./types";

export type ScoreTone = "excellent" | "good" | "fair" | "poor";
export type ScoreGrade = "S" | "A" | "B" | "C" | "D" | "F";

/** Severity of a score issue (quality / match / style), shared across surfaces. */
export type ScoreSeverity = "low" | "medium" | "high";

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

/** Token intent for chip/pill surfaces (intent tokens have no `warn`). */
export function toneToIntent(tone: ScoreTone): Intent {
  switch (tone) {
    case "excellent":
      return "success";
    case "good":
      return "accent";
    case "fair":
      return "neutral";
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
