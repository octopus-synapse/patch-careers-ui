/**
 * Banner — editorial inline notice (success / danger).
 *
 * Tinted hairline-bordered box; maps `intent` to the editorial palette so
 * the success/error banners the auth screens were hand-rolling with raw
 * `palette.*[50/200/700]` ramps share one definition.
 */

import type { ReactElement, ReactNode } from "react";
import { TText, TYStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts } from "./fonts";

export type BannerIntent = "success" | "danger";

// Tints are the intent color at low alpha — slightly stronger on dark so the
// wash stays visible against the dark paper.
const TINT: Record<"light" | "dark", Record<BannerIntent, string>> = {
  light: { success: "rgba(22,163,74,0.08)", danger: "rgba(220,38,38,0.08)" },
  dark: { success: "rgba(74,222,128,0.12)", danger: "rgba(248,113,113,0.12)" },
};

export type BannerProps = {
  intent: BannerIntent;
  children: ReactNode;
  testID?: string;
};

export function Banner({ intent, children, testID }: BannerProps): ReactElement {
  const palette = useEditorialPalette();
  const color = palette[intent];
  const tint = TINT[useThemeName()][intent];
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
