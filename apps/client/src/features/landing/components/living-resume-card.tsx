/**
 * `LivingResumeCard` — Camila's resume, changing per selected job.
 *
 * The proof at the heart of the page: three chips, one resume, and everything
 * on it — title, match, summary, the order of the strengths, which experience
 * bullet each entry shows — re-reads for the job. The match number takes the
 * score ramp's colour, exactly the bands the prototype used.
 */

import { landingAccents, landingScoreBand, landingScoreRamp, shadows } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import { Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useI18n } from "@/providers/i18n-provider";
import { landingSans } from "../lib/landing-fonts";
import { landingSound } from "../lib/landing-sound";
import { landingGrid } from "../lib/layout";
import { ALL_EXPERIENCES, DEMO_JOBS, type DemoJobKey, orderedSkills } from "../model/demo-data";
import { LandingRobot } from "./robot";

const JOB_KEYS: readonly DemoJobKey[] = ["vendas", "atend", "mkt"];
const CARD_PADDING = 26;
const COLUMN_GAP = 40;
/** The demo's `botRead()` beat: the cameo scans for 900ms, then rules. */
const CAMEO_READ_MS = 900;

export interface LivingResumeCardProps {
  readonly width: number;
  /** The cameo re-reads whenever the chapter arrives or the job changes. */
  readonly active?: boolean;
}

export function LivingResumeCard({ width, active = true }: LivingResumeCardProps): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const [job, setJob] = useState<DemoJobKey>("vendas");
  const [reading, setReading] = useState(true);

  // The demo's `botRead`: scan for a beat, then rule — with a `plim` when the
  // verdict approves.
  useEffect(() => {
    if (!active) return;
    setReading(true);
    const timer = setTimeout(() => {
      setReading(false);
      if (DEMO_JOBS[job].match >= 80) landingSound.play("plim");
    }, CAMEO_READ_MS);
    return () => clearTimeout(timer);
  }, [active, job]);

  const spec = DEMO_JOBS[job];
  const matchColor = landingScoreRamp[landingScoreBand(spec.match)].ink;
  const available = landingGrid(width).copyWidth;
  const stacked = available < 640;
  // Floor minus a hair: yoga wraps when the pair lands exactly on the inner
  // width, so the columns concede a pixel instead of stacking.
  const columnWidth = stacked
    ? available - CARD_PADDING * 2
    : Math.floor((available - CARD_PADDING * 2 - COLUMN_GAP) / 2) - 1;

  return (
    <YStack gap={18}>
      {/* The three jobs. */}
      <XStack gap={8} flexWrap="wrap">
        {JOB_KEYS.map((key) => {
          const active = key === job;
          return (
            <Pressable key={key} onPress={() => setJob(key)} accessibilityRole="button">
              <XStack
                borderRadius={999}
                borderWidth={1}
                borderColor={active ? palette.ink : palette.hairline}
                backgroundColor={active ? palette.ink : palette.surface}
                paddingHorizontal={16}
                paddingVertical={9}
              >
                <Text
                  fontFamily={landingSans}
                  fontSize={14}
                  fontWeight="500"
                  color={active ? palette.bg : palette.ink}
                >
                  {t(`landing.demo.chips.${key}`)}
                </Text>
              </XStack>
            </Pressable>
          );
        })}
      </XStack>

      {/* The resume. */}
      <YStack
        backgroundColor={palette.panel}
        borderRadius={24}
        borderWidth={1}
        borderColor={palette.hairline}
        padding={CARD_PADDING}
        shadowColor={shadows.xl.mobile.shadowColor}
        shadowOpacity={shadows.xl.mobile.shadowOpacity}
        shadowRadius={shadows.xl.mobile.shadowRadius}
        shadowOffset={shadows.xl.mobile.shadowOffset}
      >
        {/* The ATS robot cameo, reading over the card's shoulder (`#robot2`). */}
        {active ? (
          <YStack position="absolute" top={-44} right={-74} zIndex={2} pointerEvents="none">
            <Animated.View key={`cameo-${job}`} entering={FadeIn.duration(400)}>
              <LandingRobot
                width={104}
                face={reading ? "scan" : spec.match >= 80 ? "happy" : "sad"}
                chest={
                  reading
                    ? t("landing.demo.labels.reading")
                    : `${spec.match >= 80 ? "✓" : "✗"} ${spec.match}%`
                }
              />
            </Animated.View>
          </YStack>
        ) : null}
        <XStack justifyContent="space-between" alignItems="flex-start" gap={24}>
          <YStack>
            <Text fontFamily={editorialFonts.serif} fontSize={28} color={palette.ink}>
              {t("landing.demo.name")}
            </Text>
            <Animated.View key={`title-${job}`} entering={FadeIn.duration(350)}>
              <Text
                fontFamily={landingSans}
                fontSize={14}
                fontWeight="500"
                color={palette.ink}
                marginTop={2}
              >
                {t(`landing.demo.jobs.${job}.title`)}
              </Text>
            </Animated.View>
          </YStack>
          <YStack alignItems="flex-end">
            <Text fontFamily={landingSans} fontSize={13} color={matchColor}>
              {t("landing.demo.labels.match")}
            </Text>
            <Animated.View key={`match-${job}`} entering={FadeIn.duration(350)}>
              <Text fontFamily={editorialFonts.serif} fontSize={34} color={matchColor}>
                {`${spec.match}%`}
              </Text>
            </Animated.View>
          </YStack>
        </XStack>

        <XStack gap={COLUMN_GAP} marginTop={16} flexWrap="wrap">
          {/* Left: summary + strengths. */}
          <YStack width={columnWidth} gap={14}>
            <YStack gap={6}>
              <SectionLabel>{t("landing.demo.labels.summary")}</SectionLabel>
              <Animated.View key={`summary-${job}`} entering={FadeIn.duration(350)}>
                <Text fontFamily={landingSans} fontSize={13} lineHeight={20} color={palette.body}>
                  {t(`landing.demo.jobs.${job}.summary`)}
                </Text>
              </Animated.View>
            </YStack>
            <YStack gap={8}>
              <SectionLabel>{t("landing.demo.labels.strengths")}</SectionLabel>
              <XStack gap={6} flexWrap="wrap">
                {orderedSkills(job).map((skill, at) => {
                  const promoted = at < spec.top.length;
                  return (
                    <Animated.View
                      key={`${job}-${skill}`}
                      entering={FadeIn.delay(at * 35).duration(300)}
                    >
                      <XStack
                        borderRadius={999}
                        borderWidth={1}
                        borderColor={promoted ? landingAccents.indigo.accent : palette.hairline}
                        backgroundColor={promoted ? landingAccents.indigo.soft : palette.surface}
                        paddingHorizontal={10}
                        paddingVertical={4}
                      >
                        <Text
                          fontFamily={editorialFonts.mono}
                          fontSize={11}
                          color={promoted ? palette.ink : palette.muted}
                        >
                          {t(`landing.demo.skills.${skill}`)}
                        </Text>
                      </XStack>
                    </Animated.View>
                  );
                })}
              </XStack>
            </YStack>
          </YStack>

          {/* Right: experience, each entry telling this job's version. */}
          <YStack width={columnWidth} gap={6}>
            <SectionLabel>{t("landing.demo.labels.experience")}</SectionLabel>
            <YStack gap={12}>
              {ALL_EXPERIENCES.map((experience) => {
                const dimmed = spec.hidden.includes(experience);
                return (
                  <Animated.View key={`${job}-${experience}`} entering={FadeIn.duration(350)}>
                    <YStack opacity={dimmed ? 0.35 : 1} gap={2}>
                      <Text
                        fontFamily={landingSans}
                        fontSize={13}
                        fontWeight="600"
                        color={palette.ink}
                      >
                        {t(`landing.demo.experience.${experience}.title`)}
                      </Text>
                      <Text
                        fontFamily={landingSans}
                        fontSize={13}
                        lineHeight={19}
                        color={palette.muted}
                      >
                        {t(`landing.demo.experience.${experience}.${job}`)}
                      </Text>
                      {dimmed ? (
                        <Text
                          fontFamily={editorialFonts.mono}
                          fontSize={11}
                          color={landingAccents.indigo.accent}
                          marginTop={2}
                        >
                          {t("landing.demo.labels.collapsed")}
                        </Text>
                      ) : null}
                    </YStack>
                  </Animated.View>
                );
              })}
            </YStack>
          </YStack>
        </XStack>

        {/* What Patch did for this job. */}
        <YStack marginTop={20} paddingTop={16} borderTopWidth={1} borderTopColor={palette.hairline}>
          <Animated.View key={`note-${job}`} entering={FadeIn.duration(350)}>
            <Text fontFamily={landingSans} fontSize={13} lineHeight={19} color={palette.muted}>
              {t(`landing.demo.jobs.${job}.note`)}
            </Text>
          </Animated.View>
        </YStack>
      </YStack>
    </YStack>
  );
}

function SectionLabel({ children }: { readonly children: string }): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Text fontFamily={landingSans} fontSize={13} fontWeight="500" color={palette.subtle}>
      {children}
    </Text>
  );
}
