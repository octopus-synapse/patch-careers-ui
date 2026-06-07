/**
 * CaptionButton — small editorial text button (resend / toggle / etc.).
 *
 * Replaces the ad-hoc `<Pressable style={{padding:8}}><Text caption blue/></Pressable>`
 * the auth screens were each rebuilding. Subtle ink when disabled.
 */

import type { ReactElement } from "react";
import { TText, TYStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

export type CaptionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  align?: "left" | "center" | "right";
  testID?: string;
};

export function CaptionButton({
  label,
  onPress,
  disabled = false,
  align = "center",
  testID,
}: CaptionButtonProps): ReactElement {
  const alignItems = align === "right" ? "flex-end" : align === "left" ? "flex-start" : "center";
  return (
    <TYStack alignItems={alignItems}>
      <TText
        onPress={disabled ? undefined : onPress}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        fontFamily={editorialFonts.sans}
        fontSize={13}
        fontWeight="500"
        color={disabled ? "$inkSubtle" : "$accentBlue"}
        paddingVertical={8}
        paddingHorizontal={8}
        {...(testID ? { testID } : {})}
      >
        {label}
      </TText>
    </TYStack>
  );
}
