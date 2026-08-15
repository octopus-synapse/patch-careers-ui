/**
 * <MarketPulseCard> — "No mercado": the dynamic layer of the Currículos tab.
 * While Quality/Style are fixed scores of the resume itself, this card shows
 * how the master performs against the market right now — the Match range
 * across the precomputed recommendations ("78–92% em 14 vagas") over a 0–100
 * track, with a per-job sheet behind a tap.
 *
 * Collapses silently while the fit lifecycle resolves, without a responded
 * fit profile (the profile page's Fit card owns that invitation), or before
 * the match worker has precomputed anything.
 */
import { scoreTone, Text, toneToEditorialKey, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { ChevronRight } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable } from "react-native";
import { useFitStatus } from "@/features/fit";
import { useI18n } from "@/providers/i18n-provider";
import { useRecommendedJobs } from "../hooks/use-recommended-jobs";
import type { RecommendedJob } from "../types";
import { MarketPulseSheet } from "./market-pulse-sheet";

export function MarketPulseCard({
  onOpenJob,
}: {
  onOpenJob: (job: RecommendedJob) => void;
}): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const fit = useFitStatus();
  const responded = fit.data?.status === "responded";
  const recs = useRecommendedJobs(responded);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (fit.isPending || !responded || recs.jobs.length === 0) return null;

  const scores = recs.jobs.map((job) => Math.round(job.matchScore));
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = min === max ? `${max}%` : `${min}–${max}%`;
  const count = recs.jobs.length;
  const caption =
    count === 1
      ? t("match.marketPulse.captionOne")
      : t("match.marketPulse.caption", { count: String(count) });

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("match.marketPulse.a11y", { range, count: String(count) })}
        onPress={() => setSheetOpen(true)}
      >
        <YStack
          borderWidth={1}
          borderColor={palette.hairline}
          backgroundColor={palette.panel}
          borderRadius={18}
          padding={18}
          gap={12}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <Text
              fontFamily={fonts.sans}
              fontSize={10}
              fontWeight="600"
              letterSpacing={1.8}
              textTransform="uppercase"
              color={palette.muted}
            >
              {t("match.marketPulse.label")}
            </Text>
            <ChevronRight size={16} color={palette.subtle} strokeWidth={1.75} />
          </XStack>
          <XStack alignItems="baseline" gap={8} flexWrap="wrap">
            <Text fontFamily={fonts.mono} fontSize={20} fontWeight="600" color={palette.ink}>
              {range}
            </Text>
            <Text fontFamily={fonts.sans} fontSize={12.5} color={palette.muted}>
              {caption}
            </Text>
          </XStack>
          {/* The range band over a 0–100 track. */}
          <YStack height={4} borderRadius={2} backgroundColor={palette.hairline}>
            <YStack
              height={4}
              borderRadius={2}
              backgroundColor={palette[toneToEditorialKey(scoreTone(max))]}
              marginLeft={`${min}%`}
              width={`${Math.max(max - min, 4)}%`}
            />
          </YStack>
        </YStack>
      </Pressable>

      <MarketPulseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        jobs={recs.jobs}
        onOpenJob={(job) => {
          setSheetOpen(false);
          onOpenJob(job);
        }}
      />
    </>
  );
}
