/**
 * The profile score, as the page shows it.
 *
 * Two top-level numbers — Style and Quality — and Quality opens into Content
 * and Completeness. The other things `GET /v1/me/scores` returns (match,
 * keywords, requirements, context, fit) all depend on a specific job, so they
 * have no meaning on a page that has no job in front of it.
 *
 * The average is computed here rather than taken from `readiness.score`. The
 * backend's readiness is a different composite: it weighs fit and coverage
 * too. Showing it under two numbers it is not the mean of would put a sum on
 * screen that does not add up, and the first thing anyone does with a number
 * over two numbers is check the arithmetic.
 *
 * Every part is nullable and that is normal, not an error state: `style` and
 * `quality` are absent until the resume is scored, and `contentQualityScore`
 * is null whenever the AI pass has not run.
 */

import type { MeScores } from "../hooks/use-me-scores";

/**
 * Rounded into [0, 100]. Deliberately local rather than the DS's `clampScore`:
 * importing it drags the whole `@patch-careers/ui` barrel — components, lucide
 * and all — into a module that is pure arithmetic, and the node test
 * environment cannot load that.
 */
function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

export type ProfileScoreParts = {
  /** How readable the resume is to a machine. */
  style: number | null;
  /** How good it is, independent of any job. The mean of the two below. */
  quality: number | null;
  /** Sub-score of quality — null when the AI pass is unavailable. */
  content: number | null;
  /** Sub-score of quality. */
  completeness: number | null;
};

export function profileScoreParts(scores: MeScores | undefined): ProfileScoreParts {
  return {
    style: scores?.style?.score ?? null,
    quality: scores?.quality?.score ?? null,
    content: scores?.quality?.contentQualityScore ?? null,
    completeness: scores?.quality?.completenessScore ?? null,
  };
}

/**
 * The mean of the top-level scores that exist.
 *
 * With only one of them present it returns that one rather than null: a user
 * whose resume has been styled but not yet content-scored still has a real
 * number to see, and calling it an average of one is honest enough. With
 * neither, there is nothing to average and it returns null.
 */
export function profileScoreAverage(parts: ProfileScoreParts): number | null {
  const top = [parts.style, parts.quality].filter((value): value is number => value !== null);
  if (top.length === 0) return null;
  return clamp(top.reduce((sum, value) => sum + value, 0) / top.length);
}

/** True when there is enough to draw anything at all. */
export function hasProfileScore(parts: ProfileScoreParts): boolean {
  return profileScoreAverage(parts) !== null;
}
