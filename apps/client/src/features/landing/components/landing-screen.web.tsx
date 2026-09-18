import { landingScrollPalette } from "@patch-careers/tokens";
import { Stack } from "expo-router";
import { type ReactElement, type ReactNode, useEffect, useRef } from "react";
import { useWindowDimensions } from "react-native";
import { initialChapterIndex, useChapterAddress } from "../hooks/use-chapter-address";
import { useChapterDeck } from "../hooks/use-chapter-deck";
import { useDeckInput } from "../hooks/use-deck-input";
import { LandingMotionContext, useLandingMotion } from "../hooks/use-landing-motion";
import { useOverlayPresence } from "../hooks/use-overlay-presence";
import { landingSans } from "../lib/landing-fonts";
import { SCROLL_LANDING_CSS } from "../lib/scroll-landing-styles";
import {
  LANDING_VARIANTS,
  LandingSequenceContext,
  type LandingVariant,
  useLandingSequence,
} from "../model/landing-variants";
import { ChapterFrame } from "./chapter-frame";
import { ScrollJourney } from "./parallax-world";
import { ProductChapter } from "./product-chapter.web";
import { ScrollViewport } from "./scroll-viewport";
import { StatisticBackdrop, StatisticHeader } from "./statistic-backdrop";

export interface LandingScreenProps {
  readonly header?: ReactNode;
}

/** The original scroll-driven chapter camera, with the redesigned product content. */
export function LandingScreen(props: LandingScreenProps): ReactElement {
  const variant: LandingVariant = "b";
  return (
    <LandingSequenceContext.Provider value={{ variant, chapters: LANDING_VARIANTS[variant] }}>
      <LandingDeck {...props} />
    </LandingSequenceContext.Provider>
  );
}
function LandingDeck({ header }: LandingScreenProps): ReactElement {
  const { chapters, variant } = useLandingSequence();
  const { width, height } = useWindowDimensions();
  const overlayOpen = useOverlayPresence();
  const motion = useLandingMotion(overlayOpen);
  const initial = useRef(initialChapterIndex(chapters)).current;
  const deck = useChapterDeck(chapters.length, height, initial, motion.reduced);
  useDeckInput({ step: deck.step, goTo: deck.goTo });
  useChapterAddress(deck.index);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const chapter = chapters[deck.index];
    if (chapter)
      window.dispatchEvent(new CustomEvent("patch:landing-active", { detail: chapter.key }));
  }, [chapters, deck.index]);

  return (
    <LandingMotionContext.Provider value={motion}>
      <ScrollViewport deck={deck} height={height} paused={overlayOpen}>
        <div
          className="lp lp-deck"
          data-testid="landing-deck"
          data-active-chapter={deck.index}
          data-active-key={chapters[deck.index]?.key}
          data-variant={variant}
          data-settled-chapter={deck.settledIndex}
          style={{ fontFamily: landingSans }}
        >
          <Stack.Screen
            options={{
              contentStyle: {
                backgroundColor: landingScrollPalette.canvas,
                width: "100%",
                maxWidth: undefined,
                alignSelf: "stretch",
              },
            }}
          />
          <style>{SCROLL_LANDING_CSS}</style>
          <StatisticBackdrop
            offset={deck.offset}
            heights={deck.heights}
            height={height}
            reduced={motion.reduced}
          />
          <main
            data-testid="landing-chapter-strip"
            // @style-allow inline: semantic web main is the absolute scene strip beneath the fixed header
            style={{ position: "absolute", inset: 0 }}
          >
            {chapters.map((chapter, index) => (
              <ChapterFrame
                key={chapter.key}
                positioned
                active={index === deck.index || index === deck.settledIndex}
                height={height}
                onMeasure={(measured) => deck.measure(index, measured)}
                inset={0}
                copyWidth={width}
                offset={deck.offset}
                heights={deck.heights}
                focus={deck.scroll?.focus}
                index={index}
                fullBleed
              >
                <div
                  data-section={chapter.key}
                  className={`lp-scene lp-scene-${chapter.key}`}
                  style={{ minHeight: height }}
                >
                  <ProductChapter
                    chapter={chapter}
                    width={width}
                    accent={landingScrollPalette.accent}
                    active={index === deck.index || index === deck.settledIndex}
                    sceneStep={0}
                  />
                </div>
              </ChapterFrame>
            ))}
          </main>
          <StatisticHeader
            offset={deck.offset}
            heights={deck.heights}
            height={height}
            reduced={motion.reduced}
          >
            <div className="lp-header">{header}</div>
            <ScrollJourney
              offset={deck.offset}
              heights={deck.heights}
              motion={motion}
              width={width}
              index={deck.index}
              onNext={() => deck.step(1)}
            />
          </StatisticHeader>
        </div>
      </ScrollViewport>
    </LandingMotionContext.Provider>
  );
}
