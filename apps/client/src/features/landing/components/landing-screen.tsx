/**
 * `LandingScreen` — the public page at `/` on web.
 *
 * The document itself cannot scroll (the app's HTML shell sets
 * `body { overflow: hidden }` so React Native's scroll views behave), so the
 * deck is a strip translated by one shared value instead. That turns out to be
 * a useful source of truth: the chapter easing stays continuous, and every
 * chapter's content rides that same offset through `ChapterLayer`'s parallax.
 *
 * `<Stack.Screen>` opts this one route out of the desktop content column —
 * every other screen is a centred, width-capped document; the landing is full bleed.
 */

import { landingAccentPalettes } from "@patch-careers/tokens";
import { useThemeName, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Stack } from "expo-router";
import { type ReactElement, type ReactNode, useCallback, useRef } from "react";
import { useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { initialChapterIndex, useChapterAddress } from "../hooks/use-chapter-address";
import { useChapterDeck } from "../hooks/use-chapter-deck";
import { useDeckInput } from "../hooks/use-deck-input";
import { useLandingMascot } from "../hooks/use-landing-mascot";
import { LandingMotionContext, useLandingMotion } from "../hooks/use-landing-motion";
import { useOverlayPresence } from "../hooks/use-overlay-presence";
import { useSceneDirector } from "../hooks/use-scene-director";
import { landingGrid, sceneLayout, walkMsFor } from "../lib/layout";
import { isStatisticChapter } from "../lib/statistic-theme";
import { CHAPTERS } from "../model/chapters";
import { BootOverlay } from "./boot-overlay";
import { ChapterContent } from "./chapter-content";
import { ChapterFrame } from "./chapter-frame";
import { ParallaxWorld, ScrollJourney } from "./parallax-world";
import { ScrollViewport } from "./scroll-viewport";
import { SoundToggle } from "./sound-toggle";
import { StatisticBackdrop, StatisticHeader } from "./statistic-backdrop";

/**
 * The root layout pins the public landing routes to the light theme.
 * Components resolve the shared light palette through Tamagui, including
 * the injected navbar and overlays.
 */
export interface LandingScreenProps {
  /** The public navbar, injected by the route so the feature never
   *  imports app-level chrome (ADR-0003 direction). Rendered inside the
   *  deck's stacking context, where the BootOverlay still covers it. */
  readonly header?: ReactNode;
}

export function LandingScreen({ header }: LandingScreenProps): ReactElement {
  return <LandingDeck header={header} />;
}

function LandingDeck({ header }: LandingScreenProps): ReactElement {
  const { width, height } = useWindowDimensions();
  const palette = useEditorialPalette();
  const accents = landingAccentPalettes[useThemeName()];
  const isDesktop = useIsDesktopWeb();
  const grid = landingGrid(width);
  const overlayOpen = useOverlayPresence();
  const motion = useLandingMotion(overlayOpen);

  // Read the hash during the FIRST render, before any effect can rewrite it.
  const deepLinkIndex = useRef(initialChapterIndex()).current;
  const deck = useChapterDeck(CHAPTERS.length, height, deepLinkIndex, motion.reduced);
  const { goTo, step, index, settledIndex, direction, offset, heights, measure } = deck;

  useDeckInput({ step, goTo });
  useChapterAddress(index);

  const chapter = CHAPTERS[index] ?? CHAPTERS[0];
  const stageMode = chapter?.key === "cena" ? "scene" : "stage";
  const sceneActive =
    isDesktop && (stageMode === "scene" || CHAPTERS[settledIndex]?.key === "cena");

  const mascot = useLandingMascot(index, direction, sceneActive);
  const sceneWalkMs = walkMsFor(sceneLayout(width, height).walkDx);
  const scene = useSceneDirector(sceneActive, mascot.controller, sceneWalkMs);

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.value }],
  }));

  const onMeasure = useCallback(
    (at: number) => (measuredHeight: number) => measure(at, measuredHeight),
    [measure],
  );

  return (
    <LandingMotionContext.Provider value={motion}>
      <ScrollViewport deck={deck} height={height} paused={overlayOpen}>
        <YStack
          testID="landing-deck"
          dataSet={{ activeChapter: String(index), settledChapter: String(settledIndex) }}
          flex={1}
          backgroundColor={palette.bg}
          overflow="hidden"
        >
          <Stack.Screen
            options={{
              contentStyle: {
                backgroundColor: palette.bg,
                width: "100%",
                maxWidth: undefined,
                alignSelf: "stretch",
              },
            }}
          />

          <ParallaxWorld
            offset={offset}
            heights={heights}
            motion={motion}
            width={width}
            height={height}
            index={index}
            position={deck.scroll?.position}
          />

          <StatisticBackdrop
            offset={offset}
            heights={heights}
            height={height}
            reduced={motion.reduced}
          />

          <Animated.View
            testID="landing-chapter-strip"
            style={deck.scroll ? { position: "absolute", inset: 0 } : stripStyle}
          >
            {CHAPTERS.map((each, at) => {
              const accent = accents[each.accent].accent;
              const fullBleed =
                (each.key === "cena" && isDesktop) ||
                each.key === "cta" ||
                each.spectacle ||
                isStatisticChapter(each.key);
              // Only the current scene and its neighbours have live components/animation mappers.
              if (deck.scroll && Math.abs(at - index) > 1 && at !== settledIndex) {
                return null;
              }
              return (
                <ChapterFrame
                  key={each.key}
                  positioned={!!deck.scroll}
                  height={height}
                  onMeasure={onMeasure(at)}
                  inset={isDesktop ? grid.gutter : 24}
                  copyWidth={isDesktop ? grid.copyWidth : width - 48}
                  offset={offset}
                  heights={heights}
                  focus={deck.scroll?.focus}
                  index={at}
                  active={at === index || at === settledIndex}
                  fullBleed={!!fullBleed}
                >
                  <ChapterContent
                    chapter={each}
                    accent={accent}
                    width={width}
                    active={at === index || at === settledIndex}
                    sceneStep={scene.step}
                  />
                </ChapterFrame>
              );
            })}
          </Animated.View>

          <ScrollJourney
            offset={offset}
            heights={heights}
            motion={motion}
            width={width}
            index={index}
            onNext={() => step(1)}
          />
          <StatisticHeader
            offset={offset}
            heights={heights}
            height={height}
            reduced={motion.reduced}
          >
            {header}
          </StatisticHeader>
          {isDesktop ? <SoundToggle /> : null}
          <BootOverlay />
        </YStack>
      </ScrollViewport>
    </LandingMotionContext.Provider>
  );
}
