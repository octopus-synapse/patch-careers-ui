/**
 * OAuthBrandButton — small brand-colored provider chip.
 *
 * Unlike the DS `OAuthButton` (a neutral ghost pill that follows the theme),
 * each chip wears its provider's own color, and wears the *same* one in both
 * schemes: a brand mark that restyled itself with the app would stop reading
 * as that brand.
 *
 * Which means one chip always lands close to the `AuthCard` behind it — GitHub
 * on the dark card, Google on the light one. The hairline is what keeps it
 * legible as a button instead of dissolving into the card.
 */

import { radius } from "@patch-careers/tokens";
import { XStack } from "@patch-careers/ui";
import { editorialFadeInDown } from "@patch-careers/ui/editorial";
import type { ComponentType, ReactElement } from "react";
import Animated from "react-native-reanimated";

/** Diameter of the chip — small on purpose; the credentials form leads. */
const CHIP_SIZE = 44;
const GLYPH_SIZE = 20;

type ChipColors = { background: string; foreground: string; border: string };

// Brand fills, not design tokens — they are fixed by each provider.
// @style-allow color: GitHub brand dark
const GITHUB_DARK = "#24292F";
// @style-allow color: official LinkedIn brand blue
const LINKEDIN_BLUE = "#0A66C2";
// @style-allow color: the white ground Google's mark is specified on
const BRAND_WHITE = "#FFFFFF";
// @style-allow color: hairlines that keep a chip off the card it matches
const CHIP_HAIRLINE = { onLight: "#D4D4D8", onDark: "#3A3F45" } as const;

export type BrandProvider = "github" | "linkedin" | "google";

export function brandChipColors(provider: BrandProvider): ChipColors {
  if (provider === "github") {
    return { background: GITHUB_DARK, foreground: BRAND_WHITE, border: CHIP_HAIRLINE.onDark };
  }
  if (provider === "google") {
    return { background: BRAND_WHITE, foreground: GITHUB_DARK, border: CHIP_HAIRLINE.onLight };
  }
  return { background: LINKEDIN_BLUE, foreground: BRAND_WHITE, border: LINKEDIN_BLUE };
}

export function OAuthBrandButton({
  provider,
  glyph,
  label,
  onPress,
  delay = 0,
  testID,
}: {
  provider: BrandProvider;
  glyph: ComponentType<{ size?: number; color?: string }>;
  /** Not rendered — the chip is icon-only, so this is its accessible name. */
  label: string;
  onPress: () => void;
  delay?: number;
  testID?: string;
}): ReactElement {
  const Glyph = glyph;
  const colors = brandChipColors(provider);
  return (
    <Animated.View entering={editorialFadeInDown(delay)}>
      <XStack
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        alignItems="center"
        justifyContent="center"
        width={CHIP_SIZE}
        height={CHIP_SIZE}
        borderRadius={radius.full}
        borderWidth={1}
        backgroundColor={colors.background}
        borderColor={colors.border}
        pressStyle={{ opacity: 0.75 }}
        {...(testID ? { testID } : {})}
      >
        <Glyph size={GLYPH_SIZE} color={colors.foreground} />
      </XStack>
    </Animated.View>
  );
}
