/**
 * VerifiedSeal — the line-work envelope stamped by an accent seal, drawn at
 * the moment the e-mail is verified. Pure strokes (no fills), matching the
 * editorial DS: the outline and flap draw themselves, the blue seal pops on
 * the bottom-right corner, the check traces inside it and a ring breathes
 * out — the "stamp" moment.
 *
 * Timings mirror the approved `verify-code-demo.html` choreography and are
 * relative to mount, so mount it exactly when the sequence calls for it.
 */

import { useEditorialPalette } from "@patch-careers/ui";
import { type ReactElement, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const OUTLINE_LENGTH = 340;
const FLAP_LENGTH = 120;
const TICK_LENGTH = 32;

const drawEase = Easing.bezier(0.4, 0, 0.2, 1);

export function VerifiedSeal(): ReactElement {
  const palette = useEditorialPalette();
  const outline = useSharedValue(OUTLINE_LENGTH);
  const flap = useSharedValue(FLAP_LENGTH);
  const tick = useSharedValue(TICK_LENGTH);
  const seal = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    outline.value = withDelay(50, withTiming(0, { duration: 500, easing: drawEase }));
    flap.value = withDelay(320, withTiming(0, { duration: 350, easing: drawEase }));
    seal.value = withDelay(450, withSpring(1, { damping: 12, stiffness: 200 }));
    tick.value = withDelay(
      700,
      withTiming(0, { duration: 350, easing: Easing.bezier(0.3, 0.7, 0.3, 1) }),
    );
    ring.value = withDelay(
      1000,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [outline, flap, tick, seal, ring]);

  const outlineProps = useAnimatedProps(() => ({ strokeDashoffset: outline.value }));
  const flapProps = useAnimatedProps(() => ({ strokeDashoffset: flap.value }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: tick.value }));

  const sealStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, seal.value * 2),
    transform: [{ scale: 0.4 + 0.6 * seal.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.02, 1], [0, 0.55, 0]),
    transform: [{ scale: 1 + 0.9 * ring.value }],
  }));

  return (
    <View style={styles.art}>
      <Svg width={96} height={72} viewBox="0 0 96 72">
        <AnimatedRect
          x={1}
          y={1}
          width={94}
          height={70}
          rx={10}
          fill="none"
          stroke={palette.hairlineStrong}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={OUTLINE_LENGTH}
          animatedProps={outlineProps}
        />
        <AnimatedPath
          d="M3 10 48 43 93 10"
          fill="none"
          stroke={palette.hairlineStrong}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={FLAP_LENGTH}
          animatedProps={flapProps}
        />
      </Svg>

      {/* A ring of page background under the seal, so it reads as laid ON the
          artwork instead of tangling with its strokes. */}
      <Animated.View style={[styles.sealHalo, { backgroundColor: palette.bg }, sealStyle]}>
        <View style={[styles.seal, { backgroundColor: palette.accent }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <AnimatedPath
              d="M20 6 9 17l-5-5"
              fill="none"
              // @style-allow color: check on the accent seal is always white, independent of theme
              stroke="#FFFFFF"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={TICK_LENGTH}
              animatedProps={tickProps}
            />
          </Svg>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.ringPulse, { borderColor: palette.accent }, ringStyle]}
      />
    </View>
  );
}

// @style-allow stylesheet: Reanimated stroke/seal animation (animated styles need plain style objects)
const styles = StyleSheet.create({
  art: {
    width: 96,
    height: 72,
  },
  sealHalo: {
    position: "absolute",
    right: -18,
    bottom: -18,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  seal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPulse: {
    position: "absolute",
    right: -15,
    bottom: -15,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
  },
});
