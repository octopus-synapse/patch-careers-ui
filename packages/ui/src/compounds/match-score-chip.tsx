/**
 * `<MatchScoreChip>` — the compatibility pill (resume ↔ job), coloured by
 * the shared score ramp. Thin wrapper over `<ScoreChip>`.
 *
 * Always renders as a percentage ("82%") so the number reads unambiguously
 * as compatibility wherever it appears (job cards, the frozen apply
 * snapshot) — never the personality Fit, which is reserved for the
 * questionnaire alone. The accessibility label is localised at the feature
 * layer (this package stays i18n-free); it falls back to a pt-BR default so
 * existing call sites keep a sensible label.
 */

import { clampScore } from "../internal/score-scale";
import { ScoreChip, type ScoreChipSize } from "./score-chip";

export type MatchScoreChipProps = {
  score: number;
  size?: ScoreChipSize;
  /** Localised a11y label. Defaults to a pt-BR phrasing for back-compat. */
  accessibilityLabel?: string;
  /** When set, the pill becomes a button (tap → e.g. open the breakdown). */
  onPress?: () => void;
};

export function MatchScoreChip({
  score,
  size = "md",
  accessibilityLabel,
  onPress,
}: MatchScoreChipProps) {
  return (
    <ScoreChip
      score={score}
      size={size}
      percent
      accessibilityLabel={accessibilityLabel ?? `${clampScore(score)}% de compatibilidade`}
      {...(onPress ? { onPress } : {})}
    />
  );
}
