/**
 * `ChapterFrame` — one full-screen chapter — and `ChapterLayer`, the parallax
 * reveal its content rides on.
 *
 * The reveal is scroll-driven, not a one-shot entrance: every layer reads the
 * deck's live offset and translates against it at a depth-dependent rate, so
 * while the strip travels, headings, paragraphs and cards separate into
 * planes — the deeper the layer, the farther it lags — and they all settle
 * exactly as the chapter lands. Travelling away
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
import { ChapterSurface } from "./chapter-surface";

export { ChapterLayer } from "./chapter-layer";

interface RevealFrame {
  readonly focus?: SharedValue<number> | undefined;
  readonly offset: SharedValue<number>;
  readonly heights: SharedValue<number[]>;
  readonly index: number;
  readonly viewport: number;
  readonly narrow: boolean;
}

const RevealContext = createContext<RevealFrame | null>(null);
export const useChapterReveal = (): RevealFrame | null => useContext(RevealContext);

export interface ChapterLayerProps {
  /** 0 = heading, 1 = paragraphs/sources, 2 = cards, big numbers, demos. */
  readonly depth?: 0 | 1 | 2;
  /** Independent travel for neighbouring cards in the same depth plane. */
  readonly order?: number;
  readonly children: ReactNode;
}

export interface ChapterFrameProps {
  readonly positioned?: boolean;
  readonly focus?: SharedValue<number> | undefined;
  readonly active: boolean;
  readonly height: number;
  readonly onMeasure: (height: number) => void;
  /** Left inset of the copy — the grid's gutter on desktop. */
  readonly inset: number;
  /** Width of the copy column, so text never runs under the mascot's stage. */
  readonly copyWidth: number;
  /** The deck's live translation, feeding every layer's parallax. */
  readonly offset: SharedValue<number>;
  readonly heights: SharedValue<number[]>;
  readonly index: number;
  /** Window-spanning chapters (the scene, the finale) skip the copy column. */
  readonly fullBleed?: boolean;
  readonly children: ReactNode;
}

export function ChapterFrame({
  positioned = false,
  focus,
  active,
  height,
  onMeasure,
  inset,
  copyWidth,
  offset,
  heights,
  index,
  fullBleed = false,
  children,
}: ChapterFrameProps): ReactElement {
  const { width } = useWindowDimensions();
  // The desktop gutter would eat a phone screen; below the breakpoint the
  // chapter also stops being vertically centred so long copy can breathe.
  const isNarrow = width < DESKTOP_WEB_BREAKPOINT;
  const frame = useMemo<RevealFrame>(
    () => ({ offset, heights, index, viewport: height, narrow: isNarrow, focus }),
    [offset, heights, index, height, isNarrow, focus],
  );
  const positionStyle = useAnimatedStyle(() => {
    if (!positioned) return {};
    let top = 0;
    for (let at = 0; at < index; at += 1) top += heights.value[at] ?? height;
    return {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      transform: [{ translateY: top - offset.value }],
    };
  });
  return (
    <RevealContext.Provider value={frame}>
      <Animated.View style={positionStyle}>
        <YStack
          testID={`landing-chapter-${index}`}
          minHeight={height}
          flexShrink={0}
          overflow="hidden"
          justifyContent={isNarrow ? "flex-start" : "center"}
          paddingLeft={fullBleed ? 0 : inset}
          paddingRight={isNarrow && !fullBleed ? inset : 0}
          paddingVertical={fullBleed ? 0 : isNarrow ? 96 : 72}
          onLayout={(event: { nativeEvent: { layout: { height: number } } }) =>
            onMeasure(event.nativeEvent.layout.height)
          }
        >
          <ChapterSurface active={active}>
            <YStack maxWidth={fullBleed ? undefined : copyWidth}>{children}</YStack>
          </ChapterSurface>
        </YStack>
      </Animated.View>
    </RevealContext.Provider>
  );
}
