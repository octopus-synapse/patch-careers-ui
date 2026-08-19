/**
 * BrandMark — the Patch Careers puzzle mark: two interlocking pieces, ink on
 * the left and brand blue on the right (source SVG lives in
 * apps/client/assets/images/patch-careers-mark.svg).
 *
 * Stays on `react-native-svg`: SVG `fill` props take raw color strings, not
 * Tamagui `$tokens`. Dark mode mirrors `BrandLockup`'s tuned variant: warm
 * ivory ink, a more luminous blue, and a surface-colored stroke that widens
 * the seam between the pieces (in light the bright gap reads for free).
 */

import type { ReactElement } from "react";
import Svg, { Path } from "react-native-svg";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";

const LIGHT = { ink: "#151A30", blue: "#5766E8" };
const DARK = { ink: "#E9E5D9", blue: "#6272F2" };

// Native mark geometry — width/height derive from this ratio.
const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 290;

export function BrandMark({ size = 28 }: { size?: number }): ReactElement {
  const editorialPalette = useEditorialPalette();
  const isDark = useThemeName() === "dark";
  const c = isDark ? DARK : LIGHT;
  const seam = isDark ? { stroke: editorialPalette.surface, strokeWidth: 11 } : {};
  return (
    <Svg
      width={size * (VIEW_WIDTH / VIEW_HEIGHT)}
      height={size}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
    >
      <Path
        d="M 20 0 H 135 V 66 H 149 A 22 22 0 1 1 149 94 H 135 V 157.9 A 42 42 0 1 0 95 228.5 V 282 A 8 8 0 0 1 87 290 H 20 A 20 20 0 0 1 0 270 V 20 A 20 20 0 0 1 20 0 Z"
        fill={c.ink}
        {...seam}
      />
      <Path
        d="M 153 23 H 256 A 24 24 0 0 1 280 47 V 163 A 22 22 0 0 0 280 207 V 266 A 24 24 0 0 1 256 290 H 115 A 8 8 0 0 1 107 282 V 224 A 8 8 0 0 0 98 217 A 30 30 0 1 1 128 168 A 11 11 0 0 0 147 160 V 108.2 A 34 34 0 1 0 147 51.8 V 29 A 6 6 0 0 1 153 23 Z"
        fill={c.blue}
        {...seam}
      />
    </Svg>
  );
}
