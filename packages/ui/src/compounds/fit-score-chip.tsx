/**
 * `<FitScoreChip>` — score pill colored by the `fitScoreIntent` ramp.
 *
 * 80+ green / 60-79 blue / 40-59 neutral / <40 red. Thin wrapper over the
 * shared `<ScoreChip>`; surfaces the score as accessible text so VoiceOver
 * reads "Score de compatibilidade 87 de 100".
 */

import { clampScore } from "../internal/fit-score";
import { ScoreChip, type ScoreChipSize } from "./score-chip";

export type FitScoreChipProps = {
  score: number;
  size?: ScoreChipSize;
};

export function FitScoreChip({ score, size = "md" }: FitScoreChipProps) {
  return (
    <ScoreChip
      score={score}
      size={size}
      accessibilityLabel={`Score de compatibilidade ${clampScore(score)} de 100`}
    />
  );
}
