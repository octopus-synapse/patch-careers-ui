/**
 * `PuzzleBanner` — the two interlocking pieces of the mark, spread wide as a
 * banner. The account menu wears it above the identity block; the profile
 * page wears the same thing as its cover, so the two surfaces that show you
 * to yourself agree on what "you" looks like.
 *
 * `fit` is the difference between them. The menu panel is a fixed 290×72 box
 * and stretches the art to fill it (`stretch`, how it was drawn). A cover
 * spans whatever the page is wide, so it scales the art to cover and crops
 * (`cover`) — otherwise the tab that pushes through the seam smears into a
 * lozenge.
 *
 * A `coverURL` replaces the art with the person's own image; the geometry
 * (height, radii, whatever is layered on top) does not move.
 */

import { Image } from "expo-image";
import type { ReactElement, ReactNode } from "react";
import Svg, { Path } from "react-native-svg";
import { TStack } from "../internal/tamagui-shim";
import { useEditorialMenu } from "../internal/use-editorial-menu";

/** The left piece pushes a tab out at mid-height; the right one receives it. */
const PIECE_LEFT = "M0,0 H88 V25 c15,-6.5 15,28 0,21.5 V72 H0 Z";
const PIECE_RIGHT = "M290,0 H88 V25 c15,-6.5 15,28 0,21.5 V72 H290 Z";
const SEAM = "M88,0 V25 c15,-6.5 15,28 0,21.5 V72";

export interface PuzzleBannerProps {
  readonly height: number;
  /** Corner radii, top and bottom. Default: square. */
  readonly topRadius?: number;
  readonly bottomRadius?: number;
  /** The person's own cover image; replaces the puzzle art when set. */
  readonly coverURL?: string | undefined;
  /** `stretch` fills the box with the art as drawn; `cover` scales and crops. */
  readonly fit?: "stretch" | "cover";
  /** Layered over the banner (the change-cover control, for instance). */
  readonly children?: ReactNode;
  readonly accessibilityLabel?: string | undefined;
}

export function PuzzleBanner({
  height,
  topRadius = 0,
  bottomRadius = 0,
  coverURL,
  fit = "stretch",
  children,
  accessibilityLabel,
}: PuzzleBannerProps): ReactElement {
  const menu = useEditorialMenu();

  return (
    <TStack
      height={height}
      borderTopLeftRadius={topRadius}
      borderTopRightRadius={topRadius}
      borderBottomLeftRadius={bottomRadius}
      borderBottomRightRadius={bottomRadius}
      overflow="hidden"
      backgroundColor={menu.puzzleRight}
      {...(accessibilityLabel === undefined
        ? {}
        : { accessibilityRole: "image" as const, accessibilityLabel })}
    >
      <TStack position="absolute" top={0} left={0} right={0} bottom={0}>
        {coverURL ? (
          <Image
            source={{ uri: coverURL }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 290 72"
            preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "none"}
          >
            <Path d={PIECE_LEFT} fill={menu.puzzleLeft} />
            <Path d={PIECE_RIGHT} fill={menu.puzzleRight} />
            <Path d={SEAM} fill="none" stroke={menu.puzzleSeam} strokeWidth={1} />
          </Svg>
        )}
      </TStack>
      {children}
    </TStack>
  );
}
