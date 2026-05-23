/**
 * Fit-score color mapping for `<FitScoreChip>`.
 *
 * Threshold buckets (D9-D12 product taxonomy):
 *   >= 80   excellent  → success
 *   60..79  good       → accent
 *   40..59  fair       → neutral (warning-ish, no warning intent in tokens yet)
 *   <  40   poor       → danger
 */

import { intent as intentTokens } from "@patch-careers/tokens/colors";
import type { Intent, ThemeName } from "./types";

export type FitBucket = "excellent" | "good" | "fair" | "poor";

export function fitScoreBucket(score: number): FitBucket {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

export function fitScoreIntent(score: number): Intent {
  const bucket = fitScoreBucket(score);
  if (bucket === "excellent") return "success";
  if (bucket === "good") return "accent";
  if (bucket === "fair") return "neutral";
  return "danger";
}

export function fitScoreColors(score: number, themeName: ThemeName) {
  return intentTokens[fitScoreIntent(score)][themeName];
}

/**
 * Clamps an arbitrary number into a valid score window [0, 100].
 * Used by the chip to avoid undefined behavior on negative/NaN inputs.
 */
export function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}
