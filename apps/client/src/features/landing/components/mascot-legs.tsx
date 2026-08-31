/**
 * `MascotLegs` — the little legs the mascot grows for the scene and finale
 * walks, geometry from the prototype: a thick limb stroke (dark left, blue
 * right) ending in a boot. Each leg is its own SVG so it can swing ±14° from
 * the hip while walking (the demo's `stepL`/`stepR`), at the prototype's
 * 0.42s cadence.
 *
 * The parent positions this directly under the mascot torso; coordinates
 * mirror the artwork's system (pieces span x 0–280, scale 0.75), with hips at
 * x=60 and x=220.
 */

import { landingMascotLegs } from "@patch-careers/tokens";
import { YStack } from "@patch-careers/ui";
import { type ReactElement, useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";

/** The artwork's unit → px scale (viewBox 500 wide → 375 px). */
const SCALE = 0.75;
/** One full step (out and back), from the demo's `.42s ease-in-out infinite`. */
const STEP_MS = 420;
const SWING_DEG = 14;

/** One leg: limb + boot in the demo's exact paths. Origin is the hip. */
function Leg({ side }: { readonly side: "left" | "right" }): ReactElement {
  const colors = landingMascotLegs[side];
  const flip = side === "left" ? -0.8 : 0.8;
  return (
    <Svg width={90 * SCALE} height={100 * SCALE} viewBox="-45 -6 90 100">
      <Path
        d="M 0 0 V 36"
        stroke={colors.limb}
        strokeWidth={30}
        strokeLinecap="round"
        fill="none"
      />
      <G transform={`translate(0 44) scale(${flip} 0.8)`}>
        <Path
          d="M -14 -16 H 20 Q 46 -16 46 4 Q 46 16 34 16 H -4 Q -14 16 -14 4 Z"
          fill={colors.boot}
          stroke={colors.outline}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Path
          d="M -8 10 H 38"
          stroke={colors.sole}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

export interface MascotLegsProps {
  readonly walking: boolean;
  /** Hip x-positions in artwork units (default: the mascot's 60 / 220). */
  readonly visible: boolean;
}

export function MascotLegs({ walking, visible }: MascotLegsProps): ReactElement {
  const swing = useSharedValue(0);

  useEffect(() => {
    if (walking) {
      swing.value = withRepeat(
        withSequence(
          withTiming(1, { duration: STEP_MS / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: STEP_MS / 2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      );
    } else {
      cancelAnimation(swing);
      swing.value = withTiming(0, { duration: 160 });
    }
  }, [swing, walking]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-swing.value * SWING_DEG}deg` }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swing.value * SWING_DEG}deg` }],
  }));

  // Hips at artwork x=60 / x=220 → px (with the +110 viewBox margin), each
  // leg SVG centred on its hip (viewBox starts at -45).
  const legWidth = 90 * SCALE;
  const leftHip = (60 + 110) * SCALE - legWidth / 2;
  const rightHip = (220 + 110) * SCALE - legWidth / 2;

  return (
    <YStack
      position="relative"
      height={100 * SCALE}
      width={375}
      opacity={visible ? 1 : 0}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          { position: "absolute", left: leftHip, top: 0, transformOrigin: "50% 0%" },
          leftStyle,
        ]}
      >
        <Leg side="left" />
      </Animated.View>
      <Animated.View
        style={[
          { position: "absolute", left: rightHip, top: 0, transformOrigin: "50% 0%" },
          rightStyle,
        ]}
      >
        <Leg side="right" />
      </Animated.View>
    </YStack>
  );
}
