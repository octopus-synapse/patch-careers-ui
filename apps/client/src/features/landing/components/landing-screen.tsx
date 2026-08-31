/**
 * `LandingScreen` — the public page at `/` on web.
 *
 * The document itself cannot scroll (the app's HTML shell sets
 * `body { overflow: hidden }` so React Native's scroll views behave), so the
 * deck is a strip translated by one shared value instead. That turns out to be
 * the better tool anyway: the chapter easing is piecewise with a slight
 * overshoot, which no browser scroll animation can express — and every
 * chapter's content rides that same offset through `ChapterLayer`'s parallax.
 *
 * `<Stack.Screen>` opts this one route out of the desktop content column —
 * every other screen is a centred 960px document; the landing is full bleed.
 */

import { landingAccentPalettes } from "@patch-careers/tokens";
import { useThemeName, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Stack } from "expo-router";
import { type ReactElement, useCallback, useRef } from "react";
import { useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";
import { initialChapterIndex, useChapterAddress } from "../hooks/use-chapter-address";
import { useChapterDeck } from "../hooks/use-chapter-deck";
import { useDeckInput } from "../hooks/use-deck-input";
import { useLandingMascot } from "../hooks/use-landing-mascot";
import { useSceneDirector } from "../hooks/use-scene-director";
import { ensureLandingFonts } from "../lib/landing-fonts";
import { landingGrid, sceneLayout, walkMsFor } from "../lib/layout";
import { CHAPTERS } from "../model/chapters";
import { BootOverlay } from "./boot-overlay";
import { ChapterContent } from "./chapter-content";
import { ChapterFrame } from "./chapter-frame";
import { ChapterRail } from "./chapter-rail";
import { LandingHeader } from "./landing-header";
import { MascotStage, type MascotStageMode } from "./mascot-stage";
import { SoundToggle } from "./sound-toggle";

/**
 * The landing follows the app's colour scheme: warm paper by day, the warm
 * dark paper of the DS by night. Every component below resolves colours from
 * the active Tamagui theme (`useEditorialPalette` / `landing*Palettes`), so
 * the whole deck re-paints when the scheme changes.
 */
export function LandingScreen(): ReactElement {
  ensureLandingFonts();
  return <LandingDeck />;
}

function LandingDeck(): ReactElement {
  const { width, height } = useWindowDimensions();
  const palette = useEditorialPalette();
  const accents = landingAccentPalettes[useThemeName()];
  const isDesktop = useIsDesktopWeb();
  const { t } = useI18n();
  const grid = landingGrid(width);

  // Read the hash during the FIRST render, before any effect can rewrite it.
  const deepLinkIndex = useRef(initialChapterIndex()).current;
  const deck = useChapterDeck(CHAPTERS.length, height, deepLinkIndex);
  const { goTo, step, index, direction, offset, measure } = deck;

  useDeckInput({ step, goTo });
  useChapterAddress(index);

  const chapter = CHAPTERS[index] ?? CHAPTERS[0];
  const stageMode: MascotStageMode =
    chapter?.key === "cena" ? "scene" : chapter?.key === "cta" ? "finale" : "stage";
  const sceneActive = isDesktop && stageMode === "scene";

  const mascot = useLandingMascot(index, direction, sceneActive);
  const sceneWalkMs = walkMsFor(sceneLayout(width, height).walkDx);
  const scene = useSceneDirector(sceneActive, mascot.controller, sceneWalkMs);

  const activeAccent = accents[chapter?.accent ?? "ink"];
  // Not every chapter hands him a line — the scene and the finale are his own.
  const placardKey = chapter ? `landing.placards.${chapter.key}` : "";
  // The translator echoes the key back when a leaf is missing, which is how we
  // tell "this chapter has no line" from "this line is empty".
  const resolve = (key: string): string => {
    const value = t(key);
    return value === key ? "" : value;
  };
  const placardText = chapter ? resolve(`${placardKey}.text`) : "";
  const placardSource = placardText !== "" ? resolve(`${placardKey}.source`) : "";

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.value }],
  }));

  const onMeasure = useCallback(
    (at: number) => (measuredHeight: number) => measure(at, measuredHeight),
    [measure],
  );

  return (
    <YStack flex={1} backgroundColor={palette.bg} overflow="hidden">
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

      <Animated.View style={stripStyle}>
        {CHAPTERS.map((each, at) => {
          const accent = accents[each.accent].accent;
          const fullBleed = each.key === "cena" || each.key === "cta";
          return (
            <ChapterFrame
              key={each.key}
              height={height}
              onMeasure={onMeasure(at)}
              inset={isDesktop ? grid.gutter : 24}
              copyWidth={isDesktop ? grid.copyWidth : width - 48}
              offset={offset}
              top={at * height}
              fullBleed={fullBleed && isDesktop}
            >
              <ChapterContent
                chapter={each}
                accent={accent}
                width={width}
                active={at === index}
                sceneStep={scene.step}
              />
            </ChapterFrame>
          );
        })}
      </Animated.View>

      {isDesktop ? (
        <MascotStage
          mascot={mascot}
          windowWidth={width}
          windowHeight={height}
          soft={activeAccent.soft}
          placardText={placardText}
          placardSource={placardSource || undefined}
          mode={stageMode}
          petLine={scene.petLine}
          direction={direction}
          index={index}
        />
      ) : null}

      <LandingHeader />
      {isDesktop ? <ChapterRail index={index} onSelect={goTo} /> : null}
      {isDesktop ? <SoundToggle /> : null}
      <BootOverlay />
    </YStack>
  );
}
