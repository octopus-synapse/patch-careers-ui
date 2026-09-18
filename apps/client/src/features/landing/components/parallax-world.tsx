/** Persistent scenery: each object reads the same scroll, at a different depth. */
import { landingScrollPalette } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { BrandMark, editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useI18n } from "@/providers/i18n-provider";
import type { LandingMotion } from "../hooks/use-landing-motion";
import { useLandingAccents } from "../hooks/use-landing-palettes";
import { chapterPosition } from "../lib/parallax-math";
import { isStatisticChapter } from "../lib/statistic-theme";
import { CHAPTERS } from "../model/chapters";

export interface WorldProps {
  readonly position?: SharedValue<number> | undefined;
  readonly offset: SharedValue<number>;
  readonly heights: SharedValue<number[]>;
  readonly motion: LandingMotion;
  readonly width: number;
  readonly height: number;
  readonly index: number;
}

interface PlaneProps {
  readonly position: SharedValue<number>;
  readonly motion: LandingMotion;
  readonly color: string;
}

const SATELLITES = [
  { id: "mark-top", x: 0.58, y: 0.16, size: 48, depth: 0.8, kind: "mark" },
  { id: "paper-top", x: 0.87, y: 0.17, size: 84, depth: 1.4, kind: "paper" },
  { id: "spark-left", x: 0.035, y: 0.48, size: 26, depth: 0.5, kind: "spark" },
  { id: "ring-top", x: 0.31, y: 0.13, size: 18, depth: 1.1, kind: "ring" },
  { id: "paper-bottom", x: 0.57, y: 0.81, size: 66, depth: 1.8, kind: "paper" },
  { id: "mark-bottom", x: 0.9, y: 0.77, size: 72, depth: 1.1, kind: "mark" },
  { id: "spark-top", x: 0.74, y: 0.12, size: 32, depth: 2.1, kind: "spark" },
  { id: "ring-bottom", x: 0.18, y: 0.88, size: 34, depth: 0.7, kind: "ring" },
  { id: "spark-bottom", x: 0.73, y: 0.89, size: 22, depth: 1.6, kind: "spark" },
] as const;

export function ParallaxWorld({
  offset,
  heights,
  motion,
  width,
  height,
  index,
  position: scrollPosition,
}: WorldProps): ReactElement {
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const chapter = CHAPTERS[index];
  const color =
    accents[chapter?.accent === "ink" ? "indigo" : (chapter?.accent ?? "indigo")].accent;
  const position = useDerivedValue(() =>
    motion.reduced ? 0 : (scrollPosition?.value ?? chapterPosition(offset.value, heights.value)),
  );
  const narrow = width < 1024;
  const diameter = narrow ? width * 1.1 : Math.min(700, width * 0.52);
  const centerX = width * (narrow ? 0.92 : 0.76);
  const centerY = height * 0.48;
  const gridStyle = useAnimatedStyle(() => ({
    opacity: narrow ? 0.13 : 0.24,
    transform: [
      { translateX: motion.reduced ? 0 : -motion.x.value * 10 },
      { translateY: motion.reduced ? 0 : -((position.value * 26) % 48) - motion.y.value * 10 },
    ],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: motion.reduced ? 0 : Math.sin(position.value * 1.6) * 95 + motion.x.value * 34,
      },
      {
        translateY: motion.reduced ? 0 : Math.cos(position.value * 1.2) * 45 + motion.y.value * 24,
      },
      {
        scale: motion.reduced
          ? 1
          : 1 + Math.sin(position.value * Math.PI) * 0.2 + Math.sin(motion.ambient.value) * 0.05,
      },
    ],
  }));
  const horizonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: motion.reduced ? 0 : Math.sin(position.value * 0.8) * width * 0.12 },
      { translateY: motion.reduced ? 0 : Math.sin(position.value * 1.5) * 55 },
      { rotateZ: `${motion.reduced ? -12 : -12 + Math.sin(position.value) * 12}deg` },
    ],
  }));

  return (
    <YStack
      position="absolute"
      inset={0}
      overflow="hidden"
      pointerEvents="none"
      aria-hidden
      testID="landing-parallax-world"
    >
      <Animated.View style={[{ position: "absolute", inset: -60 }, gridStyle]}>
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="landing-star-grid" width={48} height={48} patternUnits="userSpaceOnUse">
              <Circle cx={24} cy={24} r={0.8} fill={palette.subtle} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#landing-star-grid)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: centerX - diameter * 0.8,
            top: centerY - diameter * 0.8,
            width: diameter * 1.6,
            height: diameter * 1.6,
          },
          haloStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="landing-atmosphere">
              <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <Stop offset="48%" stopColor={color} stopOpacity={0.09} />
              <Stop offset="100%" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#landing-atmosphere)" />
        </Svg>
      </Animated.View>

      <YStack
        position="absolute"
        left={centerX - diameter / 2}
        top={centerY - diameter / 2}
        width={diameter}
        height={diameter}
        opacity={narrow ? 0.45 : 1}
      >
        {[0, 1, 2].map((orbit) => (
          <Orbit key={orbit} orbit={orbit} position={position} motion={motion} color={color} />
        ))}
      </YStack>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: -width * 0.25,
            top: height * 0.74,
            width: width * 1.5,
            height: 240,
            opacity: 0.13,
          },
          horizonStyle,
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 1440 240" preserveAspectRatio="none">
          <Path
            d="M-100 180 Q 320 -80 720 120 T 1540 40"
            fill="none"
            stroke={color}
            strokeWidth={1}
          />
          <Path
            d="M-100 202 Q 320 -58 720 142 T 1540 62"
            fill="none"
            stroke={color}
            strokeWidth={0.6}
          />
          <Path
            d="M-100 224 Q 320 -36 720 164 T 1540 84"
            fill="none"
            stroke={color}
            strokeWidth={0.4}
          />
        </Svg>
      </Animated.View>

      {SATELLITES.filter((_, at) => !narrow || at % 3 === 0).map((satellite, at) => (
        <Satellite
          key={satellite.id}
          spec={satellite}
          seed={at}
          width={width}
          height={height}
          position={position}
          motion={motion}
          color={color}
        />
      ))}
    </YStack>
  );
}

function Orbit({
  orbit,
  position,
  motion,
  color,
}: PlaneProps & { readonly orbit: number }): ReactElement {
  const style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1100 },
      { translateX: motion.reduced ? 0 : motion.x.value * (18 + orbit * 12) },
      {
        translateY: motion.reduced
          ? 0
          : motion.y.value * (14 + orbit * 10) + Math.sin(position.value * 1.7 + orbit) * 22,
      },
      {
        rotateZ: `${orbit * 58 + (motion.reduced ? 0 : position.value * (orbit % 2 ? -48 : 65) + Math.sin(motion.ambient.value) * 14)}deg`,
      },
      { rotateX: `${orbit === 1 ? 58 : orbit === 2 ? 24 : 0}deg` },
      { rotateY: `${orbit === 2 ? 52 : 0}deg` },
      {
        scale:
          0.76 + orbit * 0.16 + (motion.reduced ? 0 : Math.sin(position.value * Math.PI) * 0.1),
      },
    ],
  }));
  return (
    <Animated.View
      testID={`landing-orbit-${orbit}`}
      style={[{ position: "absolute", inset: 0 }, style]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 600 600">
        <Circle
          cx={300}
          cy={300}
          r={270}
          stroke={color}
          strokeOpacity={0.2}
          strokeWidth={1}
          fill="none"
        />
        <Circle
          cx={300}
          cy={300}
          r={258}
          stroke={color}
          strokeOpacity={0.13}
          strokeWidth={1}
          strokeDasharray="2 16"
          fill="none"
        />
        <Path
          d="M 300 30 A 270 270 0 0 1 570 300"
          stroke={color}
          strokeOpacity={0.48}
          strokeWidth={2}
          fill="none"
        />
        <Circle cx={300} cy={30} r={orbit === 0 ? 7 : 4} fill={color} fillOpacity={0.75} />
        <Circle cx={300} cy={30} r={15} stroke={color} strokeOpacity={0.2} fill="none" />
      </Svg>
    </Animated.View>
  );
}

function Satellite({
  spec,
  seed,
  width,
  height,
  position,
  motion,
  color,
}: PlaneProps & {
  readonly spec: (typeof SATELLITES)[number];
  readonly seed: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const palette = useEditorialPalette();
  const style = useAnimatedStyle(() => {
    const scroll = motion.reduced ? 0 : position.value;
    const drift = motion.reduced ? 0 : motion.ambient.value;
    const strength = width < 1024 ? 0.35 : 1;
    return {
      opacity: spec.kind === "mark" ? 0.22 : spec.kind === "paper" ? 0.55 : 0.45,
      transform: [
        { perspective: 800 },
        {
          translateX: motion.reduced
            ? 0
            : (Math.sin(scroll * 1.5 + seed) * 90 + motion.x.value * 26 * spec.depth) * strength,
        },
        {
          translateY: motion.reduced
            ? 0
            : (Math.sin(scroll * 1.15 + seed * 2) * 110 * spec.depth +
                Math.sin(drift + seed) * 15 +
                motion.y.value * 20 * spec.depth) *
              strength,
        },
        {
          rotateZ: `${seed * 19 - 24 + scroll * (seed % 2 ? -32 : 38) + (motion.reduced ? 0 : Math.sin(drift + seed) * 9)}deg`,
        },
        { rotateY: `${motion.reduced ? 0 : Math.sin(scroll + seed) * 24}deg` },
        { scale: motion.reduced ? 1 : 1 + Math.sin(scroll * Math.PI) * 0.16 },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: width * spec.x,
          top: height * spec.y,
          width: spec.size,
          height: spec.size,
        },
        style,
      ]}
    >
      {spec.kind === "mark" ? (
        <BrandMark size={spec.size} />
      ) : (
        <Svg width="100%" height="100%" viewBox="0 0 80 80">
          {spec.kind === "paper" ? (
            <>
              <Rect
                x={12}
                y={4}
                width={54}
                height={70}
                rx={9}
                fill={palette.panel}
                stroke={color}
                strokeOpacity={0.4}
              />
              <Circle cx={28} cy={22} r={7} fill={color} fillOpacity={0.3} />
              <Line
                x1={42}
                x2={55}
                y1={20}
                y2={20}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
              />
              {[38, 47, 56, 65].map((line, at) => (
                <Line
                  key={line}
                  x1={23}
                  x2={at === 3 ? 43 : 55}
                  y1={line}
                  y2={line}
                  stroke={color}
                  strokeOpacity={0.28}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}
            </>
          ) : spec.kind === "spark" ? (
            <Path d="M40 2 Q42 38 78 40 Q42 42 40 78 Q38 42 2 40 Q38 38 40 2Z" fill={color} />
          ) : (
            <>
              <Circle cx={40} cy={40} r={32} stroke={color} strokeWidth={2} fill="none" />
              <Circle cx={40} cy={40} r={6} fill={color} />
            </>
          )}
        </Svg>
      )}
    </Animated.View>
  );
}

/** A live progress line and a usable next-chapter control, including on touch. */
export function ScrollJourney({
  offset,
  heights,
  motion,
  width,
  index,
  onNext,
}: Omit<WorldProps, "height"> & { readonly onNext: () => void }): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const statistic = isStatisticChapter(CHAPTERS[index]?.key);
  const color = statistic
    ? landingScrollPalette.statisticLime
    : accents[CHAPTERS[index]?.accent ?? "indigo"].accent;
  const next = CHAPTERS[index + 1];
  const progressStyle = useAnimatedStyle(() => ({
    width: (width * (chapterPosition(offset.value, heights.value) + 1)) / CHAPTERS.length,
  }));
  const tickStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: motion.reduced ? 0 : Math.sin(motion.ambient.value * 4) * 4 }],
  }));
  return (
    <YStack position="absolute" bottom={0} left={0} right={0} pointerEvents="box-none">
      <XStack
        paddingHorizontal={width >= 1024 ? 40 : 24}
        paddingBottom={22}
        alignItems="center"
        gap={16}
        pointerEvents="box-none"
      >
        <XStack gap={6} alignItems="baseline" pointerEvents="none">
          <Text fontFamily={editorialFonts.mono} fontSize={12} color={color}>
            {String(index + 1).padStart(2, "0")}
          </Text>
          <Text
            fontFamily={editorialFonts.mono}
            fontSize={10}
            color={statistic ? landingScrollPalette.statisticMuted : palette.subtle}
          >
            {`/ ${CHAPTERS.length}`}
          </Text>
        </XStack>
        <YStack width={36} height={1} backgroundColor={palette.hairline} />
        {next ? (
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel={t("landing.a11y.goToChapter", {
              title: t(`landing.rail.${next.key}`),
            })}
          >
            <XStack gap={10} alignItems="center" paddingVertical={8}>
              <Text
                fontFamily={editorialFonts.mono}
                fontSize={10}
                color={statistic ? landingScrollPalette.statisticMuted : palette.muted}
              >
                {t(`landing.rail.${next.key}`)}
              </Text>
              <Animated.View style={tickStyle}>
                <Text color={color} fontSize={16}>
                  ↓
                </Text>
              </Animated.View>
            </XStack>
          </Pressable>
        ) : null}
      </XStack>
      <YStack height={2} backgroundColor={palette.hairline}>
        <Animated.View
          testID="landing-scroll-progress"
          style={[{ height: 2, backgroundColor: color }, progressStyle]}
        />
      </YStack>
    </YStack>
  );
}
