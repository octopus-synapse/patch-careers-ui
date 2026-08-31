/**
 * `ScoreGrid` — Camila's three score cards, the prototype's two-column layout:
 * style and quality stacked on the left, the match card (with its four
 * subscores) on the right.
 *
 * Colours come from the landing score ramp; the 20-segment bar is the same
 * "how far along" read the product uses, painted in the band's ink.
 */

import { landingScoreBand, shadows } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { useLandingScoreRamp } from "../hooks/use-landing-palettes";
import { landingSans } from "../lib/landing-fonts";
import { landingGrid } from "../lib/layout";
import { DEMO_SCORES, type DemoScore, type DemoSubScore } from "../model/demo-data";

const SEGMENTS = 20;
const GRID_GAP = 12;

export interface ScoreGridProps {
  readonly width: number;
}

export function ScoreGrid({ width }: ScoreGridProps): ReactElement {
  const [style, quality, match] = DEMO_SCORES;
  const available = landingGrid(width).copyWidth;
  const stacked = available < 640;
  // Explicit column widths: yoga's wrap math measures flex children at their
  // content size, which pushed the columns onto separate rows.
  const columnWidth = stacked ? available : (available - GRID_GAP) / 2;
  return (
    <XStack gap={GRID_GAP} flexWrap="wrap" alignItems="flex-start">
      <YStack width={columnWidth} gap={GRID_GAP}>
        {style ? <ScoreCard score={style} /> : null}
        {quality ? <ScoreCard score={quality} /> : null}
      </YStack>
      <YStack width={columnWidth}>{match ? <ScoreCard score={match} /> : null}</YStack>
    </XStack>
  );
}

function ScoreCard({ score }: { readonly score: DemoScore }): ReactElement {
  const scoreRamp = useLandingScoreRamp();
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const band = scoreRamp[landingScoreBand(score.value)];

  return (
    <YStack
      backgroundColor={palette.panel}
      borderRadius={20}
      borderWidth={1}
      borderColor={palette.hairline}
      padding={18}
      gap={9}
      shadowColor={shadows.lg.mobile.shadowColor}
      shadowOpacity={shadows.lg.mobile.shadowOpacity}
      shadowRadius={shadows.lg.mobile.shadowRadius}
      shadowOffset={shadows.lg.mobile.shadowOffset}
    >
      <XStack justifyContent="space-between" alignItems="flex-start" gap={12}>
        <YStack flex={1}>
          <Text fontFamily={landingSans} fontSize={15} fontWeight="600" color={palette.ink}>
            {t(`landing.scores.${score.key}.name`)}
          </Text>
          <Text
            fontFamily={landingSans}
            fontSize={12}
            lineHeight={17}
            color={palette.muted}
            marginTop={2}
          >
            {t(`landing.scores.${score.key}.what`)}
          </Text>
        </YStack>
        <Text fontFamily={editorialFonts.serif} fontSize={34} color={band.ink}>
          {String(score.value)}
        </Text>
      </XStack>

      {/* The 20-segment progress bar. */}
      <XStack gap={3}>
        {Array.from({ length: SEGMENTS }, (_, at) => (
          <YStack
            // biome-ignore lint/suspicious/noArrayIndexKey: the bar is positional by nature
            key={at}
            flex={1}
            height={8}
            borderRadius={2}
            backgroundColor={
              at < Math.round(score.value / (100 / SEGMENTS)) ? band.ink : palette.hairline
            }
          />
        ))}
      </XStack>

      <Text fontFamily={landingSans} fontSize={12} lineHeight={17} color={palette.body}>
        <Text fontFamily={landingSans} fontSize={12} color={palette.muted}>
          {`${t("landing.scores.whyLabel")} `}
        </Text>
        {t(`landing.scores.${score.key}.why`)}
        {score.sub ? null : (
          <>
            <Text fontFamily={landingSans} fontSize={12} color={palette.muted}>
              {` · ${t("landing.scores.fixLabel")} `}
            </Text>
            {t(`landing.scores.${score.key}.fix`)}
            <Text fontFamily={editorialFonts.mono} fontSize={12} color={band.ink}>
              {` +${score.gain}`}
            </Text>
          </>
        )}
      </Text>

      {score.sub ? (
        <YStack marginTop={2}>
          {score.sub.map((sub) => (
            <SubScoreRow key={sub.key} sub={sub} />
          ))}
        </YStack>
      ) : null}
    </YStack>
  );
}

function SubScoreRow({ sub }: { readonly sub: DemoSubScore }): ReactElement {
  const scoreRamp = useLandingScoreRamp();
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const band = scoreRamp[landingScoreBand(sub.value)];

  return (
    <XStack
      gap={10}
      paddingVertical={8}
      borderTopWidth={1}
      borderTopColor={palette.hairline}
      alignItems="flex-start"
    >
      <Text fontFamily={editorialFonts.mono} fontSize={12} color={band.ink} width={26}>
        {String(sub.value)}
      </Text>
      <Text
        fontFamily={landingSans}
        fontSize={12.5}
        fontWeight="500"
        color={palette.ink}
        width={110}
      >
        {t(`landing.scores.sub.${sub.key}.name`)}
      </Text>
      <Text fontFamily={landingSans} fontSize={11.5} lineHeight={16} color={palette.muted} flex={1}>
        {t(`landing.scores.sub.${sub.key}.fix`)}
        {sub.locked ? null : (
          <Text fontFamily={editorialFonts.mono} fontSize={11.5} color={band.ink}>
            {` +${sub.gain ?? 0}`}
          </Text>
        )}
      </Text>
    </XStack>
  );
}
