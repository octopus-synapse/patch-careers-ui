/**
 * BrandMark — small SVG monogram with editorial accent dot.
 *
 * Stays on `react-native-svg`: SVG `fill` props take raw color strings, not
 * Tamagui `$tokens`, so we read hex straight from the editorial palette.
 */

import type { ReactElement } from "react";
import Svg, { Circle, Rect } from "react-native-svg";
import { useEditorialPalette } from "../internal/use-editorial-palette";

export function BrandMark({ size = 28 }: { size?: number }): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x={0} y={0} width={22} height={22} rx={5} fill={editorialPalette.primary} />
      <Rect x={6} y={5} width={4} height={12} rx={1} fill={editorialPalette.surface} />
      <Rect x={10} y={5} width={6} height={4} rx={1} fill={editorialPalette.surface} />
      <Rect x={10} y={9} width={6} height={3} rx={1} fill={editorialPalette.surface} />
      <Circle cx={24.5} cy={24.5} r={3} fill={editorialPalette.accent} />
    </Svg>
  );
}
