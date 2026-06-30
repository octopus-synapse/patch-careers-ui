/**
 * fit-score.ts — backward-compatible aliases. The canonical score ramp now
 * lives in `score-scale.ts`; these re-exports keep existing FitScoreChip /
 * ScoreChip / StyleScoreChip imports working unchanged. New code should
 * import from `score-scale.ts` directly.
 */

export type { ScoreTone as FitBucket } from "./score-scale";
export {
  clampScore,
  scoreColors as fitScoreColors,
  scoreIntent as fitScoreIntent,
  scoreTone as fitScoreBucket,
} from "./score-scale";
