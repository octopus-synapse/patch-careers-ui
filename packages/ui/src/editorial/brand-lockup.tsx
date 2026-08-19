/**
 * BrandLockup — the full horizontal logo: puzzle mark + "PATCH" over
 * "CAREERS" (source SVG in apps/client/assets/images/patch-careers-mark.svg
 * carries the mark; the letterforms are hand-drawn strokes).
 *
 * Stays on `react-native-svg`: SVG paint props take raw color strings, not
 * Tamagui `$tokens`. Dark mode is a tuned variant, not a raw flip: ink drops
 * to the paper's warm ivory (pure near-white reads as a blown-out slab), the
 * blue piece steps one notch more luminous, and the thin CAREERS strokes get
 * their own lighter blue to survive the dark ground. The pieces also gain a
 * surface-colored stroke: its outer half vanishes into the bar while the
 * inner half widens the seam between the pieces — in light the bright gap
 * reads for free against the navy, in dark it needs the help.
 */

import type { ReactElement } from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";

// Lockup geometry — width derives from this ratio.
const VIEW_WIDTH = 952;
const VIEW_HEIGHT = 290;

const LIGHT = { ink: "#151A30", blue: "#5766E8", blueInk: "#5766E8" };
const DARK = { ink: "#E9E5D9", blue: "#6272F2", blueInk: "#8B96F5" };

const PIECE_INK =
  "M 20 0 H 135 V 66 H 149 A 22 22 0 1 1 149 94 H 135 V 157.9 A 42 42 0 1 0 95 228.5 V 282 A 8 8 0 0 1 87 290 H 20 A 20 20 0 0 1 0 270 V 20 A 20 20 0 0 1 20 0 Z";
const PIECE_BLUE =
  "M 153 23 H 256 A 24 24 0 0 1 280 47 V 163 A 22 22 0 0 0 280 207 V 266 A 24 24 0 0 1 256 290 H 115 A 8 8 0 0 1 107 282 V 224 A 8 8 0 0 0 98 217 A 30 30 0 1 1 128 168 A 11 11 0 0 0 147 160 V 108.2 A 34 34 0 1 0 147 51.8 V 29 A 6 6 0 0 1 153 23 Z";

export function BrandLockup({ height = 48 }: { height?: number }): ReactElement {
  const palette = useEditorialPalette();
  const isDark = useThemeName() === "dark";
  const c = isDark ? DARK : LIGHT;
  // Seam stroke: dark-only (see header comment). Width in viewBox units.
  const seam = isDark ? { stroke: palette.surface, strokeWidth: 11 } : {};
  return (
    <Svg
      width={height * (VIEW_WIDTH / VIEW_HEIGHT)}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
    >
      <Path d={PIECE_INK} fill={c.ink} {...seam} />
      <Path d={PIECE_BLUE} fill={c.blue} {...seam} />
      {/* PATCH */}
      <G transform="translate(332,44) scale(1.4)" stroke={c.ink} strokeWidth={17} fill="none">
        <Path d="M 8.5 90 V 8.5 H 36 A 24 24 0 0 1 36 56.5 H 8.5" />
        <Path
          d="M 84 90 L 117 0 H 133 L 166 90 H 149 L 125 24.5 L 101 90 Z"
          fill={c.ink}
          stroke="none"
        />
        <Circle cx={125} cy={63} r={9.5} fill={c.blueInk} stroke="none" />
        <Path d="M 190 8.5 H 258 M 224 8.5 V 90" />
        <Path d="M 341.5 16.2 A 36.5 36.5 0 1 0 341.5 73.8" />
        <Path d="M 382.5 0 V 90 M 433.5 0 V 90 M 382.5 47 H 433.5" />
      </G>
      {/* CAREERS — strokes run thicker than the source art (6 → 9) with round
          caps: at navbar size they render ~1–2px, and the thin squared strokes
          alias unevenly ("crooked" letters). Optical size correction. */}
      <G
        transform="translate(332,188) scale(1.2)"
        stroke={c.blueInk}
        strokeWidth={9}
        strokeLinecap="round"
        fill="none"
      >
        <Path d="M 28.3 7.8 A 16.75 16.75 0 1 0 28.3 34.2" />
        <Path d="M 81 42 L 96.5 4 L 112 42 M 87 29 H 106" />
        <Path d="M 166 42 V 4 H 178 A 10.5 10.5 0 0 1 178 25 H 166 M 178 25 L 191 42" />
        <Path d="M 270 4 H 248 V 42 H 270 M 248 22 H 266" />
        <Path d="M 351 4 H 329 V 42 H 351 M 329 22 H 347" />
        <Path d="M 409 42 V 4 H 421 A 10.5 10.5 0 0 1 421 25 H 409 M 421 25 L 434 42" />
        <Path d="M 509.1 8.6 A 8.75 8.75 0 1 0 501.5 21.75 A 8.75 8.75 0 1 1 493.9 34.9" />
      </G>
    </Svg>
  );
}
