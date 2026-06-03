/**
 * InlineLink — right-aligned subtle link (e.g. "Forgot password?").
 *
 * Router-agnostic: the app wires navigation via `onPress` (the package never
 * imports expo-router).
 */

import { editorialPalette } from "@patch-careers/tokens";
import type { ReactElement } from "react";
import { TText, TYStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

export type InlineLinkProps = {
  label: string;
  onPress: () => void;
  align?: "left" | "right";
  testID?: string;
};

export function InlineLink({
  label,
  onPress,
  align = "right",
  testID,
}: InlineLinkProps): ReactElement {
  return (
    <TYStack marginTop={12} alignItems={align === "right" ? "flex-end" : "flex-start"}>
      <TText
        onPress={onPress}
        accessibilityRole="link"
        fontFamily={editorialFonts.sans}
        fontSize={13}
        color="$accentBlue"
        fontWeight="500"
        textDecorationLine="underline"
        textDecorationColor={editorialPalette.accent}
        {...(testID ? { testID } : {})}
      >
        {label}
      </TText>
    </TYStack>
  );
}
