/**
 * Banner — editorial inline notice (success / danger).
 *
 * Tinted hairline-bordered box; maps `intent` to the editorial palette so
 * the success/error banners the auth screens were hand-rolling with raw
 * `palette.*[50/200/700]` ramps share one definition.
 */

import { editorialPalette } from "@patch-careers/tokens";
import type { ReactElement, ReactNode } from "react";
import { TText, TYStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

export type BannerIntent = "success" | "danger";

const INTENT: Record<BannerIntent, { color: string; tint: string }> = {
  success: { color: editorialPalette.success, tint: "rgba(22,163,74,0.08)" },
  danger: { color: editorialPalette.danger, tint: "rgba(220,38,38,0.08)" },
};

export type BannerProps = {
  intent: BannerIntent;
  children: ReactNode;
  testID?: string;
};

export function Banner({ intent, children, testID }: BannerProps): ReactElement {
  const { color, tint } = INTENT[intent];
  return (
    <TYStack
      backgroundColor={tint}
      borderColor={color}
      borderWidth={1}
      borderRadius={10}
      paddingVertical={14}
      paddingHorizontal={16}
      {...(testID ? { testID } : {})}
    >
      <TText fontFamily={editorialFonts.sans} fontSize={14} lineHeight={20} color={color}>
        {children}
      </TText>
    </TYStack>
  );
}
