/**
 * BrandMark — the Patch Careers puzzle mark: two interlocking pieces (source
 * SVG in apps/client/assets/images/patch-careers-mark.svg).
 *
 * Colours come from `useBrandPieces()`, shared with the mascot: the logo IS
 * the mascot. This file used to carry its own dark pair — a warm ivory and a
 * lifted periwinkle — which drifted until the mark no longer looked like the
 * character it depicts. It also stroked each whole path to "widen the seam",
 * which outlined the entire silhouette and both jigsaw knobs in near-black.
 * Pure white against the brand indigo separates on its own, as it does on the
 * mascot, so the stroke is gone.
 */
import type { ReactElement } from "react";
import Svg, { Path } from "react-native-svg";
import { useBrandPieces } from "../internal/use-brand-pieces";

// Native mark geometry — width/height derive from this ratio.
const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 290;

export function BrandMark({ size = 28 }: { size?: number }): ReactElement {
  const pieces = useBrandPieces();
  return (
    <Svg
      width={size * (VIEW_WIDTH / VIEW_HEIGHT)}
      height={size}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
    >
      <Path
        d="M 20 0 H 135 V 66 H 149 A 22 22 0 1 1 149 94 H 135 V 157.9 A 42 42 0 1 0 95 228.5 V 282 A 8 8 0 0 1 87 290 H 20 A 20 20 0 0 1 0 270 V 20 A 20 20 0 0 1 20 0 Z"
        fill={pieces.plain}
      />
      <Path
        d="M 153 23 H 256 A 24 24 0 0 1 280 47 V 163 A 22 22 0 0 0 280 207 V 266 A 24 24 0 0 1 256 290 H 115 A 8 8 0 0 1 107 282 V 224 A 8 8 0 0 0 98 217 A 30 30 0 1 1 128 168 A 11 11 0 0 0 147 160 V 108.2 A 34 34 0 1 0 147 51.8 V 29 A 6 6 0 0 1 153 23 Z"
        fill={pieces.indigo}
      />
    </Svg>
  );
}
