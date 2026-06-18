/**
 * `<StyleScoreChip>` — Style Score pill for a resume template.
 *
 * A `<ScoreChip>` with a leading palette glyph so it reads as the template's
 * *Style Score* (visual ATS-safety), distinct from Match/Fit scores that use
 * the bare `<FitScoreChip>`. Tappable via `onPress` (e.g. open the breakdown).
 * The accessibility label is localised by the caller (this package is
 * i18n-free); a neutral fallback keeps it usable without one.
 */

import { Palette } from "lucide-react-native";
import { Icon } from "../icons/icon";
import { clampScore } from "../internal/fit-score";
import { ScoreChip, type ScoreChipSize } from "./score-chip";

export type StyleScoreChipProps = {
  score: number;
  size?: ScoreChipSize;
  /** Localised a11y label, e.g. "Style score 100 de 100". */
  accessibilityLabel?: string;
  onPress?: () => void;
};

export function StyleScoreChip({ score, size = "md", accessibilityLabel, onPress }: StyleScoreChipProps) {
  const iconSize = size === "lg" ? "sm" : "xs";
  return (
    <ScoreChip
      score={score}
      size={size}
      accessibilityLabel={accessibilityLabel ?? `Style score ${clampScore(score)} de 100`}
      leading={(fg) => <Icon as={Palette} size={iconSize} color={fg} />}
      {...(onPress ? { onPress } : {})}
    />
  );
}
