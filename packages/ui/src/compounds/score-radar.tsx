/**
 * `<ScoreRadar>` — a handful of 0-100 scores as a polygon.
 *
 * Hand-rolled on `react-native-svg`: the repo has no charting library and one
 * radar does not justify adding one. Static by design — the polygon's `points`
 * is a string prop, so animating it would mean interpolating a string on every
 * frame for a shape that only changes when the backend recomputes.
 *
 * Deliberately carries NO numbers. The axis labels say what is being measured;
 * the breakdown beside it says how much. Printing the values on the chart too
 * makes the reader check the shape against the digits instead of reading it.
 *
 * The chart is i18n-free — labels arrive already localised, which is what lets
 * it live in the DS.
 *
 * A caveat worth stating where it can't be missed: when one axis is derived
 * from others (the profile plots Quality alongside the Content and Completeness
 * it averages), the enclosed area double-counts. The polygon is a silhouette to
 * recognise, not an area to compare or sum.
 */

import type { ReactElement } from "react";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";
import { editorialFonts as fonts } from "../editorial/fonts";
import { clampScore, scoreInk } from "../internal/score-scale";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";

export type ScoreRadarAxis = {
  /** Already-localised, and short — this is drawn at 11px beside the shape. */
  label: string;
  /** null plots at the centre and gets no dot: measured-as-nothing, not zero. */
  value: number | null;
};

export type ScoreRadarProps = {
  axes: ScoreRadarAxis[];
  /** Distance from the centre to the outer web ring. */
  radius?: number;
  accessibilityLabel?: string;
};

/** The rings the web is drawn at, as a percentage of `radius`. */
const WEB_RINGS = [25, 50, 75, 100];
/** How far outside the outer ring the labels sit. */
const LABEL_OFFSET = 18;
/**
 * Three axes is a triangle — the floor for a shape that reads as a shape. Two
 * is a line and one is a dot, and neither says anything a bar wouldn't say
 * better. Callers check this before rendering.
 */
export const SCORE_RADAR_MIN_AXES = 3;

export function ScoreRadar({
  axes,
  radius = 104,
  accessibilityLabel,
}: ScoreRadarProps): ReactElement | null {
  const palette = useEditorialPalette();
  const themeName = useThemeName();

  if (axes.length < SCORE_RADAR_MIN_AXES) return null;

  // The box has to hold the widest label on each side, not just the shape.
  const pad = radius + LABEL_OFFSET + 62;
  const cx = pad;
  const cy = radius + LABEL_OFFSET + 26;
  const width = pad * 2;
  const height = cy + radius + LABEL_OFFSET + 26;

  const n = axes.length;
  const point = (index: number, r: number): [number, number] => {
    // Start at twelve o'clock and go clockwise, so the first axis reads first.
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / n;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };
  const polygon = (r: (index: number) => number): string =>
    axes.map((_, i) => point(i, r(i)).join(",")).join(" ");

  return (
    <Svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      {...(accessibilityLabel === undefined
        ? { accessible: false }
        : { accessibilityRole: "image", accessibilityLabel })}
    >
      {WEB_RINGS.map((percent) => (
        <Polygon
          key={percent}
          points={polygon(() => (radius * percent) / 100)}
          fill="none"
          stroke={palette.hairline}
          strokeWidth={1}
        />
      ))}

      {axes.map((axis, i) => {
        const [x, y] = point(i, radius);
        return (
          <Line
            key={axis.label}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={palette.hairline}
            strokeWidth={1}
          />
        );
      })}

      <Polygon
        points={polygon((i) => (radius * clampScore(axes[i]?.value ?? 0)) / 100)}
        fill={palette.accent}
        // 12% of a light blue over the dark panel is nearly invisible; the
        // dark wash needs more ink to read as an area at all.
        fillOpacity={themeName === "dark" ? 0.28 : 0.12}
        stroke={palette.accent}
        strokeWidth={2}
      />

      {axes.map((axis, i) => {
        if (axis.value === null) return null;
        const [x, y] = point(i, (radius * clampScore(axis.value)) / 100);
        return (
          <Circle
            key={axis.label}
            cx={x}
            cy={y}
            r={6}
            fill={scoreInk(axis.value, themeName)}
            stroke={palette.panel}
            strokeWidth={2}
          />
        );
      })}

      {axes.map((axis, i) => {
        const [lx, ly] = point(i, radius + LABEL_OFFSET);
        const dx = lx - cx;
        // `dominantBaseline` support is patchy across react-native-svg
        // versions and platforms, so the baseline is nudged by hand instead —
        // it degrades identically everywhere.
        const anchor = Math.abs(dx) < 1 ? "middle" : dx > 0 ? "start" : "end";
        return (
          <SvgText
            key={axis.label}
            x={lx}
            y={ly + 4}
            textAnchor={anchor}
            fontFamily={fonts.mono}
            fontSize={11}
            fill={axis.value === null ? palette.subtle : palette.muted}
          >
            {axis.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
