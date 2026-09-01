/**
 * `BootOverlay` — the demo's opening beat: paper covers the screen, the two
 * puzzle pieces slide in from opposite sides, overshoot, click together, and
 * the curtain fades. Doubles as a mask for font loading, exactly as it did in
 * the prototype (`bootA`/`bootB`, 0.9s; curtain off at 950ms).
 */

import { brandPiecePalettes } from "@patch-careers/tokens";
import { YStack } from "@patch-careers/ui";
import { useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { landingSound } from "../lib/landing-sound";

const PIECE_A =
  "M 20 0 H 135 V 66 H 149 A 22 22 0 1 1 149 94 H 135 V 157.9 A 42 42 0 1 0 95 228.5 V 282 A 8 8 0 0 1 87 290 H 20 A 20 20 0 0 1 0 270 V 20 A 20 20 0 0 1 20 0 Z";
const PIECE_B =
  "M 153 23 H 256 A 24 24 0 0 1 280 47 V 163 A 22 22 0 0 0 280 207 V 266 A 24 24 0 0 1 256 290 H 115 A 8 8 0 0 1 107 282 V 224 A 8 8 0 0 0 98 217 A 30 30 0 1 1 128 168 A 11 11 0 0 0 147 160 V 108.2 A 34 34 0 1 0 147 51.8 V 29 A 6 6 0 0 1 153 23 Z";

/** The demo's snap curve. */
const SNAP = Easing.bezier(0.36, 0.07, 0.19, 0.97);

export function BootOverlay(): ReactElement | null {
  const palette = useEditorialPalette();
  // Same shared source as every other brandmark and the mascot — this
  // overlay is the first thing anyone sees, so it must not be the one
  // place the logo shows up in a different pair of colours.
  const pieceColors = brandPiecePalettes[useThemeName()];
  const [gone, setGone] = useState(false);
  const slide = useSharedValue(46);
  const pieces = useSharedValue(0);
  const curtain = useSharedValue(1);

  useEffect(() => {
    // 0–25% hold, slide with overshoot to 70%/85%, settle at 100% (of 0.9s).
    slide.value = withDelay(
      225,
      withSequence(
        withTiming(-4, { duration: 405, easing: SNAP }),
        withTiming(2, { duration: 135, easing: SNAP }),
        withTiming(0, { duration: 135, easing: SNAP }),
      ),
    );
    pieces.value = withDelay(225, withTiming(1, { duration: 135 }));
    curtain.value = withDelay(950, withTiming(0, { duration: 450 }));
    // The demo plays its `pop` as the curtain lifts.
    const pop = setTimeout(() => landingSound.play("pop"), 950);
    const remove = setTimeout(() => setGone(true), 1450);
    return () => {
      clearTimeout(pop);
      clearTimeout(remove);
    };
  }, [slide, pieces, curtain]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: curtain.value }));
  const aStyle = useAnimatedStyle(() => ({
    opacity: pieces.value,
    transform: [{ translateX: -slide.value }],
  }));
  const bStyle = useAnimatedStyle(() => ({
    opacity: pieces.value,
    transform: [{ translateX: slide.value }],
  }));

  if (gone) return null;

  return (
    <Animated.View
      style={[
        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
        overlayStyle,
      ]}
      pointerEvents="none"
    >
      <YStack flex={1} backgroundColor={palette.bg} alignItems="center" justifyContent="center">
        <YStack width={120} height={105} position="relative">
          <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, aStyle]}>
            <Svg width={120} height={105} viewBox="-60 -20 400 330">
              <Path d={PIECE_A} fill={pieceColors.plain} />
            </Svg>
          </Animated.View>
          <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, bStyle]}>
            <Svg width={120} height={105} viewBox="-60 -20 400 330">
              <Path d={PIECE_B} fill={pieceColors.indigo} />
            </Svg>
          </Animated.View>
        </YStack>
      </YStack>
    </Animated.View>
  );
}
