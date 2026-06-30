/**
 * `<FitScoreChip>` — score pill colored by the shared score ramp.
 *
 * 80+ green / 60-79 blue / 40-59 neutral / <40 red. Thin wrapper over the
 * shared `<ScoreChip>`. The accessibility label is localised at the feature
 * layer (this package stays i18n-free); it falls back to a pt-BR default so
 * existing call sites keep reading "Score de compatibilidade 87 de 100".
 */

import { clampScore } from "../internal/score-scale";
import { ScoreChip, type ScoreChipSize } from "./score-chip";

export type FitScoreChipProps = {
  score: number;
  size?: ScoreChipSize;
  /** When true, appends the letter grade after the number ("82 · A"). */
  grade?: boolean;
  /** Localised a11y label. Defaults to a pt-BR phrasing for back-compat. */
  accessibilityLabel?: string;
  /** When set, the pill becomes a button (tap → e.g. open the breakdown). */
  onPress?: () => void;
};

export function FitScoreChip({
  score,
  size = "md",
  grade = false,
  accessibilityLabel,
  onPress,
}: FitScoreChipProps) {
  return (
    <ScoreChip
      score={score}
      size={size}
      grade={grade}
      accessibilityLabel={
        accessibilityLabel ?? `Score de compatibilidade ${clampScore(score)} de 100`
      }
      {...(onPress ? { onPress } : {})}
    />
  );
}
