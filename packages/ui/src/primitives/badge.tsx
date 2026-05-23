/**
 * `<Badge>` — small inline status pill, often used for counts or labels.
 */

import { intent as intentTokens, radius } from "@patch-careers/tokens";
import type { ReactNode } from "react";
import { TStack } from "../internal/tamagui-shim";
import type { Intent } from "../internal/types";
import { useThemeName } from "../internal/use-theme-name";
import { Text } from "./text";

export type BadgeProps = {
  intent?: Intent;
  children: ReactNode;
};

export function Badge({ intent: intentName = "neutral", children }: BadgeProps) {
  const themeName = useThemeName();
  const tokens = intentTokens[intentName][themeName];

  return (
    <TStack
      backgroundColor={tokens.subtleBg}
      paddingHorizontal={8}
      paddingVertical={2}
      borderRadius={radius.full}
      alignSelf="flex-start"
    >
      <Text preset="caption" color={tokens.subtleFg}>
        {children}
      </Text>
    </TStack>
  );
}
