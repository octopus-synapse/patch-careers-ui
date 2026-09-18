/** The compact "patch." lockup used by the standalone landing navbar. */
import { brandColors, landingScrollPalette } from "@patch-careers/tokens";
import { Text, XStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

const SERIOUS_PIECE =
  "M20 0H135V66H149A22 22 0 1 1 149 94H135V157.9A42 42 0 1 0 95 228.5V282A8 8 0 0 1 87 290H20A20 20 0 0 1 0 270V20A20 20 0 0 1 20 0Z";
const EAGER_PIECE =
  "M153 23H256A24 24 0 0 1 280 47V163A22 22 0 0 0 280 207V266A24 24 0 0 1 256 290H115A8 8 0 0 1 107 282V224A8 8 0 0 0 98 217A30 30 0 1 1 128 168A11 11 0 0 0 147 160V108.2A34 34 0 1 0 147 51.8V29A6 6 0 0 1 153 23Z";

export function NavBrand({
  height = 40,
  ink,
}: {
  readonly height?: number;
  readonly ink?: string | undefined;
}): ReactElement {
  const palette = useEditorialPalette();
  const dark = useThemeName() === "dark";
  const scale = height / 40;
  const markSize = 30 * scale;

  return (
    <XStack alignItems="center" gap={9 * scale} height={height}>
      <Svg width={markSize * (280 / 290)} height={markSize} viewBox="0 0 280 290" aria-hidden>
        <Path d={SERIOUS_PIECE} fill={ink ?? palette.ink} />
        <Path d={EAGER_PIECE} fill={dark ? palette.ink : brandColors.olive} />
      </Svg>
      <Text
        fontFamily={editorialFonts.sans}
        fontSize={36 * scale}
        lineHeight={40 * scale}
        fontWeight="800"
        letterSpacing={-2.7 * scale}
        color={ink ?? palette.ink}
        paddingBottom={5 * scale}
      >
        patch
        <Text color={dark ? palette.ink : landingScrollPalette.brandDot}>.</Text>
      </Text>
    </XStack>
  );
}
