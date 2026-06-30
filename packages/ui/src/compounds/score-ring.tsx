/**
 * `<ScoreRing>` — the editorial gauge for a 0–100 score, shared across the
 * quality / match / completeness surfaces. A hairline track with a single
 * tone-colored progress arc and the number in mono at the center. The tone
 * follows the unified ramp (`scoreTone` → `toneToEditorialKey`); no gradients
 * or shadows — the band color carries the only accent.
 *
 * Scores are the most expressive moment in the app, so by default the arc
 * draws and the number counts up on reveal. The arc tweens on the UI thread
 * via Reanimated; the number counts up with a short rAF loop (text doesn't
 * need 60fps). Pass `animate={false}` for web/reduced-motion/tests to render
 * the final state instantly. `onRevealComplete` fires when the count-up ends
 * so the feature layer can play a haptic (this package stays haptics-free at
 * the primitive level).
 */

import { type ReactNode, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";
import { editorialFonts as fonts } from "../editorial/fonts";
import { clampScore, scoreGrade, scoreTone, toneToEditorialKey } from "../internal/score-scale";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { Text } from "../primitives/text";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DRAW_MS = 720;

export type ScoreRingProps = {
  score: number;
  size?: number;
  strokeWidth?: number;
  /** Show the letter grade under the number ("82" + "A"). */
  grade?: boolean;
  /** Optional content rendered under the number (e.g. a tiny label). */
  label?: ReactNode;
  /** Animate the arc draw + count-up on reveal. Default true. */
  animate?: boolean;
  /** Fires once the reveal animation completes (feature layer plays haptic). */
  onRevealComplete?: () => void;
};

export function ScoreRing({
  score,
  size = 64,
  strokeWidth = 5,
  grade = false,
  label,
  animate = true,
  onRevealComplete,
}: ScoreRingProps) {
  const palette = useEditorialPalette();
  const target = clampScore(score);
  const color = palette[toneToEditorialKey(scoreTone(score))];

  const center = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  const progress = useSharedValue(animate ? 0 : 1);
  const [display, setDisplay] = useState(animate ? 0 : target);
  const onRevealRef = useRef(onRevealComplete);
  onRevealRef.current = onRevealComplete;

  // Arc: strokeDashoffset shrinks from full (empty) to the target fill.
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - (target / 100) * progress.value),
  }));

  useEffect(() => {
    if (!animate) {
      progress.value = 1;
      setDisplay(target);
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, { duration: DRAW_MS, easing: Easing.out(Easing.cubic) });

    // Count-up runs in JS (text only). Ease-out to match the arc.
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (start === 0) start = t;
      const elapsed = t - start;
      const k = Math.min(1, elapsed / DRAW_MS);
      const eased = 1 - (1 - k) ** 3;
      setDisplay(Math.round(target * eased));
      if (k < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        onRevealRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, target, progress]);

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
          <AnimatedCircle
            cx={center}
            cy={center}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
        pointerEvents="none"
      >
        <Text
          fontFamily={fonts.mono}
          fontSize={size <= 56 ? 15 : 17}
          fontWeight="600"
          color={palette.ink}
        >
          {display}
        </Text>
        {grade ? (
          <Text
            fontFamily={fonts.mono}
            fontSize={size <= 56 ? 9 : 10}
            fontWeight="600"
            letterSpacing={1}
            color={color}
          >
            {scoreGrade(target)}
          </Text>
        ) : null}
        {label}
      </View>
    </View>
  );
}
