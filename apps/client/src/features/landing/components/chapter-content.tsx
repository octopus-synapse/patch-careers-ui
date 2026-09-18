/**
 * The twelve chapters' content.
 *
 * Phase 1 renders every chapter's typography faithfully; the four interactive
 * ones (`cena`, `vivo2`, `notas2`, `auto2`) currently show only their heading
 * and will grow their demos in later phases — at which point they move into
 * their own files. Everything else is final.
 */

import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { useWindowDimensions } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useCountUp } from "../hooks/use-count-up";
import { useLandingAccents, useLandingScoreRamp } from "../hooks/use-landing-palettes";
import { INLINE_COUNTERS } from "../model/chapters";
import type { ChapterKey, ChapterSpec } from "../types";
import { CallToAction } from "./call-to-action";
import {
  ChapterHeading,
  ChapterParagraph,
  ChapterStack,
  Emphasis,
  Sources,
  UnderlinedEmphasis,
} from "./chapter-copy";
import { ChapterLayer } from "./chapter-frame";
import { DepthSurface } from "./depth-surface";
import { HeroInput } from "./hero-input";
import { LivingResumeCard } from "./living-resume-card";
import { RobotScene } from "./robot-scene";
import { ScoreGrid } from "./score-grid";
import { SpectacleChapter } from "./spectacle-chapter";
import { StatisticChapter } from "./statistic-chapter";

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
  const accents = useLandingAccents();
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
            <UnderlinedEmphasis color={accents.indigo.accent}>
              {t("landing.chapters.hero.bodyEm")}
            </UnderlinedEmphasis>
            {t("landing.chapters.hero.bodyTail")}
          </ChapterParagraph>
        </YStack>
      </ChapterLayer>
      <ChapterLayer depth={2}>
        <YStack marginTop={40}>
          <DepthSurface maxWidth={576}>
            <HeroInput />
          </DepthSurface>
        </YStack>
        <YStack marginTop={16}>
          <ChapterParagraph size={14}>{t("landing.chapters.hero.reassurance")}</ChapterParagraph>
        </YStack>
      </ChapterLayer>
    </YStack>
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
  const accents = useLandingAccents();
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
          <UnderlinedEmphasis color={accents.indigo.accent}>
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
        <DepthSurface>
          <LivingResumeCard width={width} active={active} />
        </DepthSurface>
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
  const scoreRamp = useLandingScoreRamp();
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
      <ScoreGrid width={width} />
      <ChapterLayer depth={1}>
        <XStack gap={18} flexWrap="wrap">
          <LegendSwatch color={scoreRamp.poor.ink}>
            {t("landing.chapters.notas2.legendPoor")}
          </LegendSwatch>
          <LegendSwatch color={scoreRamp.fair.ink}>
            {t("landing.chapters.notas2.legendFair")}
          </LegendSwatch>
          <LegendSwatch color={scoreRamp.good.ink}>
            {t("landing.chapters.notas2.legendGood")}
          </LegendSwatch>
          <LegendSwatch color={scoreRamp.excellent.ink}>
            {t("landing.chapters.notas2.legendExcellent")}
          </LegendSwatch>
        </XStack>
      </ChapterLayer>
    </ChapterStack>
  );
}

function AutoApply({ accent, width }: BodyProps): ReactElement {
  const accents = useLandingAccents();
  const { t } = useI18n();
  return (
    <ChapterStack>
      <ChapterLayer depth={0}>
        <YStack gap={20}>
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
            <UnderlinedEmphasis color={accents.indigo.accent}>
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

function AutoApplyNight({ accent, width }: BodyProps): ReactElement {
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
        <YStack gap={8}>
          <ChapterParagraph size={16}>{t("landing.chapters.auto2.step1")}</ChapterParagraph>
          <ChapterParagraph size={16}>{t("landing.chapters.auto2.step2")}</ChapterParagraph>
          <ChapterParagraph size={16}>{t("landing.chapters.auto2.step3")}</ChapterParagraph>
        </YStack>
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
  manifesto: SpectacleChapter,
  versions: SpectacleChapter,
  connection: SpectacleChapter,
  hero: Hero,
  dor: StatisticChapter,
  interviews: StatisticChapter,
  silence: StatisticChapter,
  robo: StatisticChapter,
  filter: StatisticChapter,
  qualified: StatisticChapter,
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
