/**
 * `AccentGlow` — the soft wash of the chapter's colour behind the mascot.
 *
 * React Native has no radial gradient in style, and `expo-linear-gradient` is
 * linear only, so this is an SVG `<RadialGradient>` — which `react-native-svg`
 * renders identically on web and native.
 *
 * It also drifts against the travel direction on a chapter change: the
 * background lagging behind the content is what sells depth.
 */

import { YStack } from "@patch-careers/ui";
import type { ReactElement } from "react";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

export interface AccentGlowProps {
  readonly color: string;
}

export function AccentGlow({ color }: AccentGlowProps): ReactElement {
  // A unitless viewBox stretched to the stage (`preserveAspectRatio="none"`)
  // keeps the gradient's percentages relative to the box it actually fills;
  // a window-sized viewBox inside the narrower stage column scaled the whole
  // wash down to a faint blob (`xMidYMid meet` is the SVG default).
  return (
    <YStack
      key={color}
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      opacity={0.9}
      pointerEvents="none"
      animation="slow"
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="landing-glow" cx="50%" cy="45%" rx="60%" ry="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="70%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#landing-glow)" />
      </Svg>
    </YStack>
  );
}
