/**
 * The twelve chapters' content.
 *
 * Phase 1 renders every chapter's typography faithfully; the four interactive
 * ones (`cena`, `vivo2`, `notas2`, `auto2`) currently show only their heading
 * and will grow their demos in later phases — at which point they move into
 * their own files. Everything else is final.
 */

import { landingAccents, landingScoreRamp } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import type { ReactElement, ReactNode } from "react";
import { Pressable, useWindowDimensions } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useCountUp } from "../hooks/use-count-up";
import { landingSans } from "../lib/landing-fonts";
import { INLINE_COUNTERS } from "../model/chapters";
import type { ChapterKey, ChapterSpec } from "../types";
import {
  BigNumber,
  ChapterHeading,
  ChapterParagraph,
  ChapterStack,
  Emphasis,
  Eyebrow,
  Sources,
  UnderlinedEmphasis,
} from "./chapter-copy";
import { ChapterLayer } from "./chapter-frame";
import { HeroInput } from "./hero-input";
import { LivingResumeCard } from "./living-resume-card";
import { NightFeed } from "./night-feed";
import { RobotScene } from "./robot-scene";
import { ScoreGrid } from "./score-grid";

export interface ChapterContentProps {
  readonly chapter: ChapterSpec;
  readonly accent: string;
  readonly width: number;
  readonly active: boolean;
  /** The scene director's beat, for the `cena` chapter's robot. */
  readonly sceneStep: number;
}

export function ChapterContent(props: ChapterContentProps): ReactElement {
  const { chapter } = props;
  const Body = BODIES[chapter.key];
  return <Body {...props} />;
}

type BodyProps = ChapterContentProps;

function Hero({ accent, width }: BodyProps): ReactElement {
  const { t } = useI18n();
  return (
    <YStack maxWidth={980}>
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={t("landing.chapters.hero.headingLead")}
          second={t("landing.chapters.hero.headingSecond")}
          emphasis={t("landing.chapters.hero.headingEm")}
          accent={accent}
          width={width}
          variant="hero"
          breakAfterLead
        />
      </ChapterLayer>
      {/* The demo's rhythm: mt-8 / mt-10 / mt-4. */}
      <ChapterLayer depth={1}>
        <YStack marginTop={32}>
          <ChapterParagraph size={24} maxWidth={576}>
            {`${t("landing.chapters.hero.bodyLead")} `}
            <UnderlinedEmphasis color={landingAccents.indigo.accent}>
              {t("landing.chapters.hero.bodyEm")}
            </UnderlinedEmphasis>
            {t("landing.chapters.hero.bodyTail")}
          </ChapterParagraph>
        </YStack>
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <YStack marginTop={40}>
          <HeroInput />
        </YStack>
        <YStack marginTop={16}>
          <ChapterParagraph size={14}>{t("landing.chapters.hero.reassurance")}</ChapterParagraph>
        </YStack>
      </ChapterLayer>
    </YStack>
  );
}

function Pain({ chapter, accent, width, active }: BodyProps): ReactElement {
  const { t } = useI18n();
  const seconds = useCountUp(
    chapter.counter?.value ?? 0,
    chapter.counter?.fractionDigits ?? 0,
    active,
  );
  const applications = useCountUp(INLINE_COUNTERS.applicationsPerJob, 0, active);
  return (
    <ChapterStack>
      <ChapterLayer depth={2}>
        <BigNumber
          value={seconds}
          unit={t("landing.chapters.dor.statUnit")}
          accent={accent}
          width={width}
        />
      </ChapterLayer>
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={t("landing.chapters.dor.heading")}
          accent={accent}
          width={width}
          variant="stat"
          maxWidth={700}
        />
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <YStack gap={20}>
          <ChapterParagraph>
            {`${t("landing.chapters.dor.bodyLead")} `}
            <Emphasis>
              {t("landing.chapters.dor.bodyApplications", { count: applications })}
            </Emphasis>
            {". "}
            <Emphasis>{t("landing.chapters.dor.bodyRatio")}</Emphasis>
            {` ${t("landing.chapters.dor.bodyTail")}`}
          </ChapterParagraph>
          <Sources>{t("landing.chapters.dor.sources")}</Sources>
        </YStack>
      </ChapterLayer>
    </ChapterStack>
  );
}

function Robot({ chapter, accent, width, active }: BodyProps): ReactElement {
  const { t } = useI18n();
  const share = useCountUp(chapter.counter?.value ?? 0, 0, active);
  const millions = useCountUp(INLINE_COUNTERS.gupyMillions, 0, active);
  return (
    <ChapterStack>
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={t("landing.chapters.robo.headingLead")}
          emphasis={t("landing.chapters.robo.headingEm")}
          accent={accent}
          width={width}
        />
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <ChapterParagraph>{t("landing.chapters.robo.body")}</ChapterParagraph>
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <YStack gap={12} flexDirection="row" alignItems="flex-end" maxWidth={860}>
          <BigNumber value={`${share}%`} accent={accent} width={width} variant="inline" />
          <YStack paddingBottom={12} flexShrink={1}>
            <ChapterParagraph size={16}>{t("landing.chapters.robo.statTail")}</ChapterParagraph>
          </YStack>
        </YStack>
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <YStack gap={20}>
          <ChapterParagraph>
            {`${t("landing.chapters.robo.gupyLead")} `}
            <Emphasis>{t("landing.chapters.robo.gupyMillions", { count: millions })}</Emphasis>
            {` ${t("landing.chapters.robo.gupyMid")} `}
            <Emphasis>{t("landing.chapters.robo.gupyPercent")}</Emphasis>
            {` ${t("landing.chapters.robo.gupyTail")}`}
          </ChapterParagraph>
          <Sources>{t("landing.chapters.robo.sources")}</Sources>
        </YStack>
      </ChapterLayer>
    </ChapterStack>
  );
}

function Scene({ width, active, sceneStep }: BodyProps): ReactElement {
  const { height } = useWindowDimensions();
  // Desktop: a window-sized canvas so the absolutely-placed robot's coords
  // are window coords (the frame is full-bleed and unpadded for this chapter).
  if (width >= 1024) {
    return (
      <YStack height={height} width="100%" position="relative">
        <RobotScene width={width} step={sceneStep} active={active} />
      </YStack>
    );
  }
  return <RobotScene width={width} step={sceneStep} active={active} />;
}

function LivingResume({ accent, width, active }: BodyProps): ReactElement {
  const { t } = useI18n();
  const interviews = useCountUp(INLINE_COUNTERS.tailoredInterviews, 1, active);
  return (
    <ChapterStack>
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={t("landing.chapters.vivo.headingLead")}
          emphasis={t("landing.chapters.vivo.headingEm")}
          tail={t("landing.chapters.vivo.headingTail")}
          accent={accent}
          width={width}
        />
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <ChapterParagraph>
          {`${t("landing.chapters.vivo.bodyLead")} `}
          <UnderlinedEmphasis color={landingAccents.indigo.accent}>
            {t("landing.chapters.vivo.bodyEm")}
          </UnderlinedEmphasis>
          {t("landing.chapters.vivo.bodyTail")}
        </ChapterParagraph>
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <YStack gap={20}>
          <ChapterParagraph size={17}>
            {`${t("landing.chapters.vivo.statLead")} `}
            <Emphasis>{t("landing.chapters.vivo.statInterviews", { count: interviews })}</Emphasis>
            {`${t("landing.chapters.vivo.statMid")} `}
            <Emphasis>{t("landing.chapters.vivo.statMinutes")}</Emphasis>
            {` ${t("landing.chapters.vivo.statTail")} `}
            <Emphasis>{t("landing.chapters.vivo.statShare")}</Emphasis>
            {` ${t("landing.chapters.vivo.statEnd")}`}
          </ChapterParagraph>
          <Sources>{t("landing.chapters.vivo.sources")}</Sources>
        </YStack>
      </ChapterLayer>
    </ChapterStack>
  );
}

function LivingResumeDemo({ accent, width, active }: BodyProps): ReactElement {
  const { t } = useI18n();
  return (
    <ChapterStack>
      {/* The demo sets this heading in plain ink — "a Camila" is a data slot
          (`#cvWho`), not an emphasised clause. */}
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={`${t("landing.chapters.vivo2.headingLead")} ${t("landing.chapters.vivo2.headingEm")} ${t("landing.chapters.vivo2.headingTail")}`}
          accent={accent}
          width={width}
          variant="demo"
          maxWidth={700}
        />
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <LivingResumeCard width={width} active={active} />
      </ChapterLayer>
    </ChapterStack>
  );
}

function Scores({ accent, width }: BodyProps): ReactElement {
  const { t } = useI18n();
  return (
    <ChapterStack>
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={t("landing.chapters.notas.headingLead")}
          emphasis={t("landing.chapters.notas.headingEm")}
          accent={accent}
          width={width}
        />
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <ChapterParagraph>{t("landing.chapters.notas.body")}</ChapterParagraph>
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <YStack gap={20}>
          <ChapterParagraph size={17}>
            {`${t("landing.chapters.notas.typoLead")} `}
            <Emphasis>{t("landing.chapters.notas.typoShareBr")}</Emphasis>
            {` ${t("landing.chapters.notas.typoMid")} `}
            <Emphasis>{t("landing.chapters.notas.typoShareUs")}</Emphasis>
            {` ${t("landing.chapters.notas.typoTail")}`}
          </ChapterParagraph>
          <Sources>{t("landing.chapters.notas.sources")}</Sources>
        </YStack>
      </ChapterLayer>
    </ChapterStack>
  );
}

function ScoresDemo({ accent, width }: BodyProps): ReactElement {
  const { t } = useI18n();
  return (
    <ChapterStack>
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={t("landing.chapters.notas2.heading")}
          accent={accent}
          width={width}
          variant="demo"
        />
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <ScoreGrid width={width} />
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <XStack gap={18} flexWrap="wrap">
          <LegendSwatch color={landingScoreRamp.poor.ink}>
            {t("landing.chapters.notas2.legendPoor")}
          </LegendSwatch>
          <LegendSwatch color={landingScoreRamp.fair.ink}>
            {t("landing.chapters.notas2.legendFair")}
          </LegendSwatch>
          <LegendSwatch color={landingScoreRamp.good.ink}>
            {t("landing.chapters.notas2.legendGood")}
          </LegendSwatch>
          <LegendSwatch color={landingScoreRamp.excellent.ink}>
            {t("landing.chapters.notas2.legendExcellent")}
          </LegendSwatch>
        </XStack>
      </ChapterLayer>
    </ChapterStack>
  );
}

function AutoApply({ accent, width }: BodyProps): ReactElement {
  const { t } = useI18n();
  return (
    <ChapterStack>
      <ChapterLayer depth={0}>
        <YStack gap={20}>
          <Eyebrow accent={accent}>{t("landing.chapters.auto.eyebrow")}</Eyebrow>
          <ChapterHeading
            lead={t("landing.chapters.auto.headingLead")}
            emphasis={t("landing.chapters.auto.headingEm")}
            accent={accent}
            width={width}
          />
        </YStack>
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <YStack gap={4}>
          <ChapterParagraph size={21}>{t("landing.chapters.auto.line1")}</ChapterParagraph>
          <ChapterParagraph size={21}>{t("landing.chapters.auto.line2")}</ChapterParagraph>
        </YStack>
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <YStack gap={20}>
          <ChapterParagraph size={17}>
            {`${t("landing.chapters.auto.bodyLead")} `}
            <UnderlinedEmphasis color={landingAccents.indigo.accent}>
              {t("landing.chapters.auto.bodyEm")}
            </UnderlinedEmphasis>
            {t("landing.chapters.auto.bodyTail")}
          </ChapterParagraph>
          <YStack gap={4}>
            <ChapterParagraph size={16}>{t("landing.chapters.auto.note1")}</ChapterParagraph>
            <ChapterParagraph size={16}>{t("landing.chapters.auto.note2")}</ChapterParagraph>
            <ChapterParagraph size={16}>{t("landing.chapters.auto.note3")}</ChapterParagraph>
          </YStack>
        </YStack>
      </ChapterLayer>
    </ChapterStack>
  );
}

function AutoApplyNight({ accent, width, active }: BodyProps): ReactElement {
  const { t } = useI18n();
  return (
    <ChapterStack>
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={t("landing.chapters.auto2.headingLead")}
          emphasis={t("landing.chapters.auto2.headingEm")}
          accent={accent}
          width={width}
          variant="demo"
          maxWidth={640}
        />
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <NightFeed active={active} />
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <YStack gap={20}>
          <ChapterParagraph size={17}>
            {`${t("landing.chapters.auto2.statLead")} `}
            <Emphasis>{t("landing.chapters.auto2.statHours")}</Emphasis>
            {` ${t("landing.chapters.auto2.statMid")} `}
            <Emphasis>{t("landing.chapters.auto2.statEasy")}</Emphasis>
            {`${t("landing.chapters.auto2.statMid2")} `}
            <Emphasis>{t("landing.chapters.auto2.statTailored")}</Emphasis>
            {t("landing.chapters.auto2.statTail")}
          </ChapterParagraph>
          <Sources>{t("landing.chapters.auto2.sources")}</Sources>
        </YStack>
      </ChapterLayer>
    </ChapterStack>
  );
}

function Click({ accent, width }: BodyProps): ReactElement {
  const { t } = useI18n();
  return (
    <ChapterStack>
      <ChapterLayer depth={0}>
        <ChapterHeading
          lead={t("landing.chapters.clique.headingLead")}
          emphasis={t("landing.chapters.clique.headingEm")}
          accent={accent}
          width={width}
        />
      </ChapterLayer>
      <ChapterLayer depth={1}>
        <ChapterParagraph size={22}>
          {`${t("landing.chapters.clique.bodyLead")} `}
          <Emphasis>{t("landing.chapters.clique.bodyEm")}</Emphasis>
          {t("landing.chapters.clique.bodyTail")}
        </ChapterParagraph>
      </ChapterLayer>
    </ChapterStack>
  );
}

function CallToAction({ accent, width, active }: BodyProps): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const footer = `${t("landing.footer.copyright")} · ${t("landing.footer.privacy")} · ${t("landing.footer.terms")} · ${t("landing.footer.recruiterPrompt")} ${t("landing.footer.recruiterLink")}`;

  if (!isDesktop) {
    return (
      <YStack gap={24}>
        <ChapterHeading
          lead={t("landing.chapters.cta.headingLead")}
          emphasis={t("landing.chapters.cta.headingEm")}
          accent={accent}
          width={width}
        />
        <ChapterParagraph size={20} maxWidth={560}>
          {t("landing.chapters.cta.body")}
        </ChapterParagraph>
        <XStack gap={20} alignItems="center">
          <Pressable onPress={() => router.push("/(auth)/sign-up")} accessibilityRole="button">
            <XStack
              backgroundColor={palette.primary}
              borderRadius={999}
              paddingHorizontal={30}
              paddingVertical={18}
            >
              <Text
                fontFamily={landingSans}
                fontSize={16}
                fontWeight="600"
                color={palette.onPrimary}
              >
                {`${t("landing.chapters.cta.button")} →`}
              </Text>
            </XStack>
          </Pressable>
          <Text fontFamily={landingSans} fontSize={14} color={palette.muted}>
            {t("landing.chapters.cta.noCard")}
          </Text>
        </XStack>
        <Text fontFamily={landingSans} fontSize={12} color={palette.muted} marginTop={48}>
          {footer}
        </Text>
      </YStack>
    );
  }

  // Desktop mirrors the demo's `.chapter.final`: the copy sits centred on the
  // WINDOW, just above the middle; the mascot walks in and lands below it
  // holding the button (`MascotStage`'s finale), and the footer pins to the
  // bottom edge. The frame is full-bleed, so window coords are frame coords.
  return (
    <YStack height={height} width="100%" position="relative" justifyContent="flex-start">
      <YStack
        position="absolute"
        top={height / 2 - 250}
        left={0}
        right={0}
        alignItems="center"
        gap={24}
      >
        <ChapterLayer depth={0}>
          <ChapterHeading
            lead={t("landing.chapters.cta.headingLead")}
            emphasis={t("landing.chapters.cta.headingEm")}
            accent={accent}
            width={width}
            centered
          />
        </ChapterLayer>
        <ChapterLayer depth={1}>
          <ChapterParagraph size={20} maxWidth={560} centered>
            {t("landing.chapters.cta.body")}
          </ChapterParagraph>
        </ChapterLayer>
      </YStack>
      <YStack
        position="absolute"
        bottom={22}
        left={0}
        right={0}
        alignItems="center"
        opacity={active ? 1 : 0}
        animation="slow"
      >
        <Text fontFamily={landingSans} fontSize={12} color={palette.muted}>
          {footer}
        </Text>
      </YStack>
    </YStack>
  );
}

/** One coloured square + range of the score legend. */
function LegendSwatch({
  color,
  children,
}: {
  readonly color: string;
  readonly children: ReactNode;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <XStack gap={6} alignItems="center">
      <YStack width={9} height={9} backgroundColor={color} borderRadius={2} />
      <Text fontFamily={editorialFonts.mono} fontSize={11} color={palette.subtle}>
        {children}
      </Text>
    </XStack>
  );
}

const BODIES: Record<ChapterKey, (props: BodyProps) => ReactElement> = {
  hero: Hero,
  dor: Pain,
  robo: Robot,
  cena: Scene,
  vivo: LivingResume,
  vivo2: LivingResumeDemo,
  notas: Scores,
  notas2: ScoresDemo,
  auto: AutoApply,
  auto2: AutoApplyNight,
  clique: Click,
  cta: CallToAction,
};
