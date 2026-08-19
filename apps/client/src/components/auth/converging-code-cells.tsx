/**
 * ConvergingCodeCells — a static mirror of the OTP row that plays the success
 * funnel: the six digit cells slide toward the row's centre (edges first,
 * centre last) while shrinking and fading, as if the code you typed folds
 * into the sealed envelope that appears in its place.
 *
 * Mounted in the exact slot the live `EditorialOtp` occupied, with matching
 * cell geometry, so the swap is invisible.
 */

import { useEditorialPalette } from "@patch-careers/ui";
import { editorialFonts } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { OTP_CELL_GAP, OTP_CELL_HEIGHT, OTP_CELL_WIDTH } from "./editorial-otp";

const CELL_COUNT = 6;
const CELL_PITCH = OTP_CELL_WIDTH + OTP_CELL_GAP;
const CONVERGE_DELAY_MS = 250;

export function ConvergingCodeCells({ digits }: { digits: string }): ReactElement {
  return (
    <View style={styles.row} pointerEvents="none">
      {Array.from({ length: CELL_COUNT }, (_, index) => (
        <Cell
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, position-keyed row
          key={index}
          char={digits[index] ?? ""}
          index={index}
        />
      ))}
    </View>
  );
}

function Cell({ char, index }: { char: string; index: number }): ReactElement {
  const palette = useEditorialPalette();
  const progress = useSharedValue(0);

  useEffect(() => {
    // edges first, centre last — the funnel
    const delay = CONVERGE_DELAY_MS + (2.5 - Math.abs(index - 2.5)) * 70;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.2, 1], [1, 0], "clamp"),
    transform: [
      { translateX: (2.5 - index) * CELL_PITCH * progress.value },
      { scale: 1 - 0.8 * progress.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.cell,
        { backgroundColor: palette.surface, borderColor: palette.hairlineStrong },
        animatedStyle,
      ]}
    >
      <Text style={[styles.digit, { color: palette.ink }]}>{char}</Text>
    </Animated.View>
  );
}

// @style-allow stylesheet: Reanimated funnel animation (animated transforms need plain style objects)
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: OTP_CELL_GAP,
  },
  cell: {
    width: OTP_CELL_WIDTH,
    height: OTP_CELL_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  digit: {
    fontFamily: editorialFonts.mono,
    fontSize: 26,
    lineHeight: 30,
  },
});
