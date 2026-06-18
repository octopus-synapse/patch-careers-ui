/**
 * <ScoreRing> — a clean editorial gauge for a 0–100 score. A hairline track
 * with a single-color progress arc and the number in mono at the center. No
 * gradients or shadows; the band color (danger / warn / success) carries the
 * only accent. Used by the resume quality surface (and reusable on cards).
 */
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

export function ScoreRing({
  score,
  size = 64,
  strokeWidth = 5,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}): ReactElement {
  const palette = useEditorialPalette();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);
  const color = clamped >= 80 ? palette.success : clamped >= 60 ? palette.warn : palette.danger;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
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
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.score, { color: palette.ink }]}>{clamped}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  score: { fontFamily: fonts.mono, fontSize: 17, fontWeight: "600", letterSpacing: 0.2 },
});
