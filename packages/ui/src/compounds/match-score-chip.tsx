/**
 * `<MatchScoreChip>` — the Match Score pill (resume ↔ job compatibility),
 * coloured by the shared score ramp. Thin wrapper over `<ScoreChip>`.
 *
 * Renamed from `FitScoreChip`: it always renders a MATCH score (job cards,
 * the frozen apply snapshot), never the personality Fit — "Fit" is now
 * reserved for the questionnaire alone. The accessibility label is
 * localised at the feature layer (this package stays i18n-free); it falls
 * back to a pt-BR default so existing call sites keep a sensible label.
 */

import { clampScore } from "../internal/score-scale";
import { ScoreChip, type ScoreChipSize } from "./score-chip";

export type MatchScoreChipProps = {
  score: number;
  size?: ScoreChipSize;
  /** When true, appends the letter grade after the number ("82 · A"). */
  grade?: boolean;
  /** Localised a11y label. Defaults to a pt-BR phrasing for back-compat. */
  accessibilityLabel?: string;
  /** When set, the pill becomes a button (tap → e.g. open the breakdown). */
  onPress?: () => void;
};

export function MatchScoreChip({
  score,
  size = "md",
  grade = false,
  accessibilityLabel,
  onPress,
}: MatchScoreChipProps) {
  return (
    <ScoreChip
      score={score}
      size={size}
      grade={grade}
      accessibilityLabel={accessibilityLabel ?? `Match Score ${clampScore(score)} de 100`}
      {...(onPress ? { onPress } : {})}
    />
  );
}
