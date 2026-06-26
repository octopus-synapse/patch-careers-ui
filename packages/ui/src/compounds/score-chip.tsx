/**
 * `<ScoreChip>` — shared base for score pills (FitScoreChip, StyleScoreChip).
 *
 * Renders a 0-100 score in a pill coloured by the `fitScoreIntent` ramp
 * (80+ green / 60-79 blue / 40-59 neutral / <40 red). Optional leading
 * slot (icon/label) and `onPress` (turns the pill into a button). The
 * accessibility label is required and provided by the caller so the text
 * can be localised at the feature layer (this package stays i18n-free).
 */

import { intent as intentTokens, radius } from "@patch-careers/tokens";
import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { clampScore, fitScoreIntent } from "../internal/fit-score";
import { TStack } from "../internal/tamagui-shim";
import { useThemeName } from "../internal/use-theme-name";
import { Text } from "../primitives/text";

export type ScoreChipSize = "sm" | "md" | "lg";

export type ScoreChipProps = {
  score: number;
  size?: ScoreChipSize;
  /** Localised label, e.g. "Style score 100 de 100". Required for a11y. */
  accessibilityLabel: string;
  /** Optional leading slot; receives the resolved foreground colour so an
   * icon can match the pill's intent colour. */
  leading?: (foreground: string) => ReactNode;
  /** When set, the pill becomes a button (tap → e.g. open a breakdown). */
  onPress?: () => void;
};

const SIZE_TO_PAD: Record<ScoreChipSize, { ph: number; pv: number; fs: number; gap: number }> = {
  sm: { ph: 6, pv: 2, fs: 12, gap: 3 },
  md: { ph: 10, pv: 4, fs: 14, gap: 4 },
  lg: { ph: 14, pv: 6, fs: 16, gap: 5 },
};

export function ScoreChip({
  score,
  size = "md",
  accessibilityLabel,
  leading,
  onPress,
}: ScoreChipProps) {
  const themeName = useThemeName();
  const safeScore = clampScore(score);
  const tokens = intentTokens[fitScoreIntent(safeScore)][themeName];
  const pad = SIZE_TO_PAD[size];

  const pill = (
    <TStack
      flexDirection="row"
      alignItems="center"
      gap={leading ? pad.gap : 0}
      backgroundColor={tokens.bg}
      paddingHorizontal={pad.ph}
      paddingVertical={pad.pv}
      borderRadius={radius.full}
      alignSelf="flex-start"
      {...(onPress ? {} : { accessibilityRole: "text", accessibilityLabel })}
    >
      {leading?.(tokens.fg)}
      <Text preset="label" fontSize={pad.fs} color={tokens.fg}>
        {safeScore}
      </Text>
    </TStack>
  );

  if (!onPress) return pill;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      {pill}
    </Pressable>
  );
}
