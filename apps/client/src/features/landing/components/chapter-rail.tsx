/**
 * `ChapterRail` — the chapter menu pinned to the right edge.
 *
 * Reads as "N. Title" per line, faded by distance from the active chapter so
 * the eye is pulled to where you are, with the active number in the chapter's
 * accent colour. The whole list is always clickable — the prototype's draggable
 * scrollbar is deliberately not ported: with twelve rows all on screen it
 * bought nothing and fought the deck's input lock.
 *
 * Hidden below the desktop breakpoint, where the page scrolls normally.
 */

import { landingAccentPalettes } from "@patch-careers/tokens";
import { Text, useThemeName, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { landingSans } from "../lib/landing-fonts";
import { CHAPTERS } from "../model/chapters";

/** Opacity by distance from the active chapter — a soft, symmetric falloff. */
const FADE = [1, 0.78, 0.56, 0.4, 0.3, 0.23, 0.18, 0.16] as const;

function fadeFor(distance: number): number {
  return FADE[Math.min(distance, FADE.length - 1)] ?? 0.16;
}

export interface ChapterRailProps {
  readonly index: number;
  readonly onSelect: (index: number) => void;
}

export function ChapterRail({ index, onSelect }: ChapterRailProps): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const accents = landingAccentPalettes[useThemeName()];

  return (
    <YStack
      position="absolute"
      right={30}
      top="50%"
      transform="translateY(-50%)"
      zIndex={50}
      gap={17}
      alignItems="flex-end"
      paddingRight={21}
      accessibilityRole="navigation"
      accessibilityLabel={t("landing.a11y.chapters")}
    >
      {/* The hairline the dots sit on. */}
      <YStack
        position="absolute"
        right={3}
        top={0}
        bottom={0}
        width={1}
        backgroundColor={palette.hairline}
      />
      {CHAPTERS.map((chapter, at) => {
        const active = at === index;
        const accent = accents[chapter.accent].accent;
        const title = t(`landing.rail.${chapter.key}`);
        return (
          <Pressable
            key={chapter.key}
            onPress={() => onSelect(at)}
            accessibilityRole="link"
            accessibilityLabel={t("landing.a11y.goToChapter", { title })}
          >
            <XStack
              alignItems="baseline"
              justifyContent="flex-end"
              gap={7}
              opacity={fadeFor(Math.abs(at - index))}
            >
              <Text
                fontSize={14}
                lineHeight={14}
                fontWeight="500"
                fontFamily={landingSans}
                color={active ? accent : palette.subtle}
              >
                {`${at + 1}.`}
              </Text>
              <Text
                fontSize={15}
                lineHeight={15}
                fontFamily={landingSans}
                color={active ? palette.ink : palette.muted}
              >
                {title}
              </Text>
              {/* The dot on the rail: grows and takes the accent when active. */}
              <YStack
                position="absolute"
                right={-21}
                top="50%"
                width={active ? 9 : 6}
                height={active ? 9 : 6}
                borderRadius={99}
                backgroundColor={active ? accent : palette.subtle}
                opacity={active ? 1 : 0.5}
                transform="translate(50%, -50%)"
              />
            </XStack>
          </Pressable>
        );
      })}
    </YStack>
  );
}
