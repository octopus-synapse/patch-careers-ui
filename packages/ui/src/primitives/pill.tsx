/**
 * `<Pill>` — chip-style container, optionally pressable.
 */

import { intent as intentTokens } from "@patch-careers/tokens/colors";
import { radius } from "@patch-careers/tokens/radius";
import type { ReactNode } from "react";
import { TStack } from "../internal/tamagui-shim";
import type { Intent } from "../internal/types";
import { useThemeName } from "../internal/use-theme-name";
import { Text } from "./text";

export type PillProps = {
  intent?: Intent;
  selected?: boolean;
  onPress?: () => void;
  children: ReactNode;
};

export function Pill({
  intent: intentName = "neutral",
  selected = false,
  onPress,
  children,
}: PillProps) {
  const themeName = useThemeName();
  const tokens = intentTokens[intentName][themeName];
  const pressStyleProp = onPress ? { pressStyle: { opacity: 0.8 } } : {};
  return (
    <TStack
      backgroundColor={selected ? tokens.bg : tokens.subtleBg}
      borderColor={selected ? tokens.bg : tokens.border}
      borderWidth={1}
      paddingHorizontal={12}
      paddingVertical={6}
      borderRadius={radius.full}
      onPress={onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={{ selected }}
      {...pressStyleProp}
    >
      <Text preset="caption" color={selected ? tokens.fg : tokens.subtleFg}>
        {children}
      </Text>
    </TStack>
  );
}
