/**
 * `ChapterFrame` — one full-screen chapter — and `ChapterLayer`, the parallax
 * reveal its content rides on.
 *
 * The reveal is scroll-driven, not a one-shot entrance: every layer reads the
 * deck's live offset and translates against it at a depth-dependent rate, so
 * while the strip travels, headings, paragraphs and cards separate into
 * planes — the deeper the layer, the farther it lags — and they all settle
 * (riding the deck's overshoot) exactly as the chapter lands. Travelling away
 * plays the same field in reverse. Content therefore stays mounted; nothing
 * pops in or out.
 *
 * `flexShrink: 0` is load-bearing — without it flexbox compresses the stacked
 * chapters and every snap target lands short.
 */

import { YStack } from "@patch-careers/ui";
import { createContext, type ReactElement, type ReactNode, useContext, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { DESKTOP_WEB_BREAKPOINT } from "@/hooks/use-desktop-web";

/**
 * How far each depth lags the strip, in px at full travel. Deeper layers lag
 * more — that difference in rate is the parallax.
 */
const LAYER_TRAVEL = [110, 70, 170] as const;
/** How fast each depth fades with distance from alignment (higher = sooner). */
const LAYER_FADE = [1.35, 1.5, 1.2] as const;

interface RevealFrame {
  readonly offset: SharedValue<number>;
  readonly top: number;
  readonly viewport: number;
}

const RevealContext = createContext<RevealFrame | null>(null);

export interface ChapterLayerProps {
  /** 0 = heading, 1 = paragraphs/sources, 2 = cards, big numbers, demos. */
  readonly depth?: 0 | 1 | 2;
  readonly children: ReactNode;
}

/** One parallax plane of a chapter's content. */
export function ChapterLayer({ depth = 1, children }: ChapterLayerProps): ReactElement {
  const frame = useContext(RevealContext);
  const travel = LAYER_TRAVEL[depth] ?? LAYER_TRAVEL[1];
  const fade = LAYER_FADE[depth] ?? LAYER_FADE[1];
  const offset = frame?.offset;
  const top = frame?.top ?? 0;
  const viewport = frame?.viewport ?? 1;

  const style = useAnimatedStyle(() => {
    if (!offset) return {};
    // 0 when this chapter is aligned; ±1 when a full viewport away.
    const progress = Math.max(-1.2, Math.min(1.2, (offset.value - top) / viewport));
    return {
      transform: [{ translateY: progress * travel }],
      opacity: 1 - Math.min(1, Math.abs(progress) * fade),
    };
  });

  return <Animated.View style={style}>{children}</Animated.View>;
}

export interface ChapterFrameProps {
  readonly height: number;
  readonly onMeasure: (height: number) => void;
  /** Left inset of the copy — the grid's gutter on desktop. */
  readonly inset: number;
  /** Width of the copy column, so text never runs under the mascot's stage. */
  readonly copyWidth: number;
  /** The deck's live translation, feeding every layer's parallax. */
  readonly offset: SharedValue<number>;
  /** This chapter's y in the strip (approximated as index × viewport). */
  readonly top: number;
  /** Window-spanning chapters (the scene, the finale) skip the copy column. */
  readonly fullBleed?: boolean;
  readonly children: ReactNode;
}

export function ChapterFrame({
  height,
  onMeasure,
  inset,
  copyWidth,
  offset,
  top,
  fullBleed = false,
  children,
}: ChapterFrameProps): ReactElement {
  const { width } = useWindowDimensions();
  // The desktop gutter would eat a phone screen; below the breakpoint the
  // chapter also stops being vertically centred so long copy can breathe.
  const isNarrow = width < DESKTOP_WEB_BREAKPOINT;
  const frame = useMemo<RevealFrame>(
    () => ({ offset, top, viewport: height }),
    [offset, top, height],
  );
  return (
    <RevealContext.Provider value={frame}>
      <YStack
        minHeight={height}
        flexShrink={0}
        justifyContent={isNarrow ? "flex-start" : "center"}
        paddingLeft={fullBleed ? 0 : inset}
        paddingRight={isNarrow && !fullBleed ? inset : 0}
        paddingVertical={isNarrow ? 96 : fullBleed ? 0 : 72}
        onLayout={(event: { nativeEvent: { layout: { height: number } } }) =>
          onMeasure(event.nativeEvent.layout.height)
        }
      >
        <YStack maxWidth={fullBleed ? undefined : copyWidth}>{children}</YStack>
      </YStack>
    </RevealContext.Provider>
  );
}
