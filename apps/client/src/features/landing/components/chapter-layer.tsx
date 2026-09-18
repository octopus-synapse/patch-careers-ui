import type { ReactElement } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useLandingMotionContext } from "../hooks/use-landing-motion";
import { chapterTravel } from "../lib/parallax-math";
import { type ChapterLayerProps, useChapterReveal } from "./chapter-frame";

const LAYER_TRAVEL = [65, 24, 110] as const;
const LAYER_FADE = [0.3, 0.4, 0.25] as const;

/** One parallax plane of a chapter's content. */
export function ChapterLayer({ depth = 1, order = 0, children }: ChapterLayerProps): ReactElement {
  const frame = useChapterReveal();
  const motion = useLandingMotionContext();
  const travel = LAYER_TRAVEL[depth] ?? LAYER_TRAVEL[1];
  const fade = LAYER_FADE[depth] ?? LAYER_FADE[1];
  const offset = frame?.offset;
  const heights = frame?.heights;
  const index = frame?.index ?? 0;
  const viewport = frame?.viewport ?? 1;
  const narrow = frame?.narrow ?? false;
  const reduced = motion?.reduced ?? true;
  const x = motion?.x;
  const y = motion?.y;

  const style = useAnimatedStyle(() => {
    if (!offset || !heights || reduced) return { opacity: 1, transform: [{ translateY: 0 }] };
    const progress = chapterTravel(offset.value, heights.value, index, viewport);
    const distance = Math.min(1, Math.abs(progress));
    const strength = narrow ? 0.35 : 1;
    const pointer = (1 - distance) * (narrow ? 0 : depth === 2 ? 9 : 3);
    return {
      transform: [
        { perspective: 1200 },
        { translateY: progress * (travel + order * 48) * strength + (y?.value ?? 0) * pointer },
        {
          translateX:
            progress * (depth === 0 ? -12 : depth === 2 ? 35 + order * 12 : 0) * strength +
            (x?.value ?? 0) * pointer,
        },
        { rotateX: `${progress * (depth === 2 ? 8 : 0) * strength}deg` },
        { rotateY: `${progress * (depth === 2 ? -4 : 0) * strength}deg` },
        { rotateZ: `${progress * (depth === 2 ? (order % 2 ? -2 : 2) : 0) * strength}deg` },
        { scale: 1 - distance * (depth === 2 ? 0.1 : 0.025) * strength },
      ],
      opacity: 1 - Math.min(1, distance * (fade + order * 0.06)),
    };
  });

  return (
    <Animated.View testID={`landing-layer-${index}-${depth}-${order}`} style={style}>
      {children}
    </Animated.View>
  );
}
