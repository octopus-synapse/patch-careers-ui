/**
 * <CompletenessRing> — a thin progress arc drawn *around* the avatar as a
 * minimalist profile-completeness gauge. The score is the backend-defined
 * `completenessScore` (required-section presence drives it down — a missing
 * high-value section like experience lowers it). Band color follows the
 * shared score ramp (`scoreTone` → `toneToEditorialKey`: success / accent /
 * warn / danger), consistent with every other score in the app. The avatar is
 * rendered as `children` in the center; the arc overlays without affecting layout.
 */
import { scoreTone, toneToEditorialKey } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

const OUTSET = 5;

export function CompletenessRing({
  percent,
  size,
  strokeWidth = 3,
  children,
}: {
  percent: number;
  size: number;
  strokeWidth?: number;
  children: ReactNode;
}): ReactElement {
  const palette = useEditorialPalette();
  const ringSize = size + OUTSET * 2;
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const r = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);
  const color = palette[toneToEditorialKey(scoreTone(clamped))];
  const center = ringSize / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {children}
      <Svg
        width={ringSize}
        height={ringSize}
        style={{ position: "absolute", top: -OUTSET, left: -OUTSET }}
        pointerEvents="none"
      >
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={r}
            stroke={palette.hairline}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}
