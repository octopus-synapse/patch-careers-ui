/**
 * Score Rank dictionary.
 *
 * Mirrors the grading scheme defined in `docs/scoring/README.md` of
 * profile-services. The exact thresholds MUST match the backend —
 * any drift produces confusing "your backend says B / UI shows C"
 * reports.
 *
 * Rank | Range  | Tailwind tone
 * ---- | ------ | ---------------------
 *  S   | 90-100 | emerald
 *  A   | 80-89  | green
 *  B   | 70-79  | blue
 *  C   | 60-69  | yellow
 *  D   | 40-59  | orange
 *  F   | 0-39   | red
 */

export type ScoreRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export const RANK_ORDER: readonly ScoreRank[] = ['F', 'D', 'C', 'B', 'A', 'S'];

export interface RankRange {
  readonly rank: ScoreRank;
  readonly minScore: number;
  readonly maxScore: number;
  readonly tailwind: string;
  readonly tailwindDark: string;
}

export const RANK_RANGES: readonly RankRange[] = [
  {
    rank: 'S',
    minScore: 90,
    maxScore: 100,
    tailwind: 'bg-emerald-100 text-emerald-700',
    tailwindDark: 'dark:bg-emerald-900/30 dark:text-emerald-200',
  },
  {
    rank: 'A',
    minScore: 80,
    maxScore: 89,
    tailwind: 'bg-green-100 text-green-700',
    tailwindDark: 'dark:bg-green-900/30 dark:text-green-200',
  },
  {
    rank: 'B',
    minScore: 70,
    maxScore: 79,
    tailwind: 'bg-blue-100 text-blue-700',
    tailwindDark: 'dark:bg-blue-900/30 dark:text-blue-200',
  },
  {
    rank: 'C',
    minScore: 60,
    maxScore: 69,
    tailwind: 'bg-yellow-100 text-yellow-800',
    tailwindDark: 'dark:bg-yellow-900/30 dark:text-yellow-200',
  },
  {
    rank: 'D',
    minScore: 40,
    maxScore: 59,
    tailwind: 'bg-orange-100 text-orange-700',
    tailwindDark: 'dark:bg-orange-900/30 dark:text-orange-200',
  },
  {
    rank: 'F',
    minScore: 0,
    maxScore: 39,
    tailwind: 'bg-red-100 text-red-700',
    tailwindDark: 'dark:bg-red-900/30 dark:text-red-200',
  },
];

/** Maps a numeric 0-100 score to the corresponding rank. Scores
 *  outside the range clamp to F / S respectively so a miscalibrated
 *  source doesn't break rendering. */
export function rankOf(score: number): ScoreRank {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function rangeOfRank(rank: ScoreRank): RankRange {
  const match = RANK_RANGES.find((r) => r.rank === rank);
  if (!match) throw new Error(`Unknown rank: ${rank}`);
  return match;
}

export function toneForRank(rank: ScoreRank): string {
  const range = rangeOfRank(rank);
  return `${range.tailwind} ${range.tailwindDark}`;
}

export function toneForScore(score: number): string {
  return toneForRank(rankOf(score));
}
