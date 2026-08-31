/**
 * `LandingRobot` — the ATS robot from the prototype's scene, geometry ported
 * verbatim from `landing-demo-v15.html` (viewBox 0 0 200 250): rounded shell,
 * dark screen face, antenna ears, chest display and little feet.
 *
 * Faces mirror the demo's states — `idle` (round eyes + smile), `scan` (flat
 * dashes while it parses), `happy` (∪ arcs) — the chest line is caller-driven
 * (idle dots, binary flicker, `¬_¬`, `^_^`), and `shake` swings the right arm
 * for the handshake. The whole bot bobs gently like the demo's `bob` loop.
 */

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
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { useLandingRobot } from "../hooks/use-landing-palettes";

export type RobotFace = "idle" | "scan" | "happy" | "sad";

export interface LandingRobotProps {
  readonly width?: number;
  readonly face?: RobotFace;
  readonly chest?: string;
  readonly shake?: boolean;
}

export function LandingRobot({
  width = 210,
  face = "idle",
  chest = "· · ·",
  shake = false,
}: LandingRobotProps): ReactElement {
  const bot = useLandingRobot();
  const height = (width / 200) * 250;
  const bob = useSharedValue(0);
  const arm = useSharedValue(0);

  // The demo's `bob 3.4s ease-in-out infinite`.
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    return () => cancelAnimation(bob);
  }, [bob]);

  // Handshake: armR up (−80°) wiggling ±10°, three times, like `shakehand`.
  useEffect(() => {
    if (shake) {
      arm.value = withSequence(
        withTiming(-80, { duration: 200 }),
        withRepeat(
          withSequence(
            withTiming(-70, { duration: 250, easing: Easing.inOut(Easing.ease) }),
            withTiming(-80, { duration: 250, easing: Easing.inOut(Easing.ease) }),
          ),
          3,
        ),
      );
    } else {
      cancelAnimation(arm);
      arm.value = withTiming(0, { duration: 250 });
    }
  }, [arm, shake]);

  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const armStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arm.value}deg` }],
  }));

  const shell = { fill: bot.shell, stroke: bot.shellStroke, strokeWidth: 2.5 } as const;
  // The demo recolours the chest line and LED with the verdict.
  const chestFill =
    face === "sad" ? bot.chestBad : face === "happy" ? bot.chestGood : bot.chestIdle;
  const ledFill =
    face === "sad"
      ? bot.ledBad
      : face === "happy"
        ? bot.ledGood
        : face === "scan"
          ? bot.ledBusy
          : bot.ledIdle;

  return (
    <Animated.View style={bobStyle}>
      {/* Right arm in its own layer so the handshake can swing it. */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: (148 / 200) * width,
            top: (150 / 250) * height,
            transformOrigin: "0% 0%",
          },
          armStyle,
        ]}
      >
        <Svg width={(52 / 200) * width} height={(60 / 250) * height} viewBox="148 150 52 60">
          <Path
            d="M148 150 c22 6 34 30 26 46 c-4 8 -16 8 -20 0 c-6 -14 -10 -26 -14 -34 z"
            {...shell}
            strokeLinejoin="round"
          />
          <Circle cx={170} cy={196} r={9} fill={bot.grey} />
        </Svg>
      </Animated.View>

      <Svg width={width} height={height} viewBox="0 0 200 250" aria-hidden>
        {/* left arm */}
        <Path
          d="M52 150 c-22 6 -34 30 -26 46 c4 8 16 8 20 0 c6 -14 10 -26 14 -34 z"
          {...shell}
          strokeLinejoin="round"
        />
        <Circle cx={30} cy={196} r={9} fill={bot.grey} />
        {/* body */}
        <Rect x={55} y={140} width={90} height={72} rx={20} {...shell} />
        <Rect x={66} y={156} width={68} height={30} rx={7} fill={bot.screen} />
        <SvgText
          x={100}
          y={175}
          fill={chestFill}
          fontSize={13}
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
        >
          {chest}
        </SvgText>
        <Circle cx={100} cy={199} r={4} fill={ledFill} />
        {/* feet */}
        <Rect x={58} y={208} width={26} height={30} rx={9} {...shell} />
        <Rect x={116} y={208} width={26} height={30} rx={9} {...shell} />
        <Rect x={60} y={232} width={22} height={7} rx={3} fill={bot.grey} />
        <Rect x={118} y={232} width={22} height={7} rx={3} fill={bot.grey} />
        {/* neck */}
        <Rect x={88} y={126} width={24} height={18} rx={6} fill={bot.grey} />
        {/* head */}
        <G>
          <Circle cx={26} cy={78} r={14} fill={bot.ear} />
          <Circle cx={22} cy={73} r={5} fill={bot.earHighlight} />
          <Circle cx={174} cy={78} r={14} fill={bot.ear} />
          <Circle cx={170} cy={73} r={5} fill={bot.earHighlight} />
          <Rect x={30} y={14} width={140} height={118} rx={44} {...shell} />
          <Rect x={44} y={30} width={112} height={86} rx={30} fill={bot.screen} />
          {face === "idle" ? (
            <G>
              <Circle cx={78} cy={70} r={11} fill={bot.eye} />
              <Circle cx={122} cy={70} r={11} fill={bot.eye} />
              <Path
                d="M92 92 q8 6 16 0"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
            </G>
          ) : null}
          {face === "scan" ? (
            <G>
              <Path d="M66 70 h24" stroke={bot.eye} strokeWidth={5} strokeLinecap="round" />
              <Path d="M110 70 h24" stroke={bot.eye} strokeWidth={5} strokeLinecap="round" />
              <Path d="M94 92 h12" stroke={bot.eye} strokeWidth={5} strokeLinecap="round" />
            </G>
          ) : null}
          {face === "sad" ? (
            <G>
              <Path
                d="M66 58 q12 -10 24 2"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M110 60 q12 -12 24 -2"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M70 70 q8 12 16 4"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M114 74 q8 12 16 0"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M90 98 q10 -8 20 0"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
              <Path d="M78 76 q-5 8 0 12 q5 -4 0 -12z" fill={bot.tear} />
            </G>
          ) : null}
          {face === "happy" ? (
            <G>
              <Path
                d="M64 74 q14 -20 28 0"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M108 74 q14 -20 28 0"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M86 90 q14 12 28 0"
                stroke={bot.eye}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
            </G>
          ) : null}
        </G>
      </Svg>
    </Animated.View>
  );
}
