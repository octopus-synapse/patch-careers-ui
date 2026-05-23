/**
 * `<FitScoreChip>` — score pill colored by the `fitScoreIntent` ramp.
 *
 * 80+ green / 60-79 blue / 40-59 neutral / <40 red. The chip surfaces
 * the score as accessible text so VoiceOver reads "Score 87 de 100".
 */

import { intent as intentTokens } from "@patch-careers/tokens/colors";
import { radius } from "@patch-careers/tokens/radius";
import { clampScore, fitScoreIntent } from "../internal/fit-score";
import { TStack } from "../internal/tamagui-shim";
import { useThemeName } from "../internal/use-theme-name";
import { Text } from "../primitives/text";

export type FitScoreChipProps = {
  score: number;
  size?: "sm" | "md" | "lg";
};

const SIZE_TO_PAD: Record<"sm" | "md" | "lg", { ph: number; pv: number; fs: number }> = {
  sm: { ph: 6, pv: 2, fs: 12 },
  md: { ph: 10, pv: 4, fs: 14 },
  lg: { ph: 14, pv: 6, fs: 16 },
};

export function FitScoreChip({ score, size = "md" }: FitScoreChipProps) {
  const themeName = useThemeName();
  const safeScore = clampScore(score);
  const intentName = fitScoreIntent(safeScore);
  const tokens = intentTokens[intentName][themeName];
  const pad = SIZE_TO_PAD[size];

  return (
    <TStack
      backgroundColor={tokens.bg}
      paddingHorizontal={pad.ph}
      paddingVertical={pad.pv}
      borderRadius={radius.full}
      alignSelf="flex-start"
      accessibilityRole="text"
      accessibilityLabel={`Score de compatibilidade ${safeScore} de 100`}
    >
      <Text preset="label" fontSize={pad.fs} color={tokens.fg}>
        {safeScore}
      </Text>
    </TStack>
  );
}
