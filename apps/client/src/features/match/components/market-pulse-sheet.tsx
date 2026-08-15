/**
 * <MarketPulseSheet> — the per-job breakdown behind the MarketPulseCard:
 * every precomputed recommendation with its individual Match chip, sorted
 * best-first. Tapping a row closes the sheet and deep-links to the job.
 */
import { MatchScoreChip, Sheet, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable, ScrollView } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import type { RecommendedJob } from "../types";

export function MarketPulseSheet({
  open,
  onOpenChange,
  jobs,
  onOpenJob,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: RecommendedJob[];
  onOpenJob: (job: RecommendedJob) => void;
}): ReactElement {
  const { t } = useI18n();
  const sorted = [...jobs].sort((a, b) => b.matchScore - a.matchScore);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("match.marketPulse.label")}
      presentation="card"
      fillHeight
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {sorted.map((job) => (
          <MarketPulseRow key={job.id} job={job} onPress={() => onOpenJob(job)} />
        ))}
      </ScrollView>
    </Sheet>
  );
}

function MarketPulseRow({
  job,
  onPress,
}: {
  job: RecommendedJob;
  onPress: () => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const score = Math.round(job.matchScore);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("match.marketPulse.rowA11y", {
        company: job.company,
        title: job.title,
        score: String(score),
      })}
      onPress={onPress}
    >
      <XStack
        alignItems="center"
        gap={12}
        paddingVertical={12}
        borderBottomWidth={1}
        borderBottomColor={palette.hairline}
      >
        <YStack flex={1} gap={2}>
          <Text fontFamily={fonts.sans} fontSize={14} fontWeight="600" color={palette.ink}>
            {job.company}
          </Text>
          <Text fontFamily={fonts.sans} fontSize={12.5} color={palette.muted} numberOfLines={1}>
            {job.title}
          </Text>
        </YStack>
        <MatchScoreChip
          score={score}
          size="sm"
          accessibilityLabel={`${score}% ${t("match.compatLabel")}`}
        />
      </XStack>
    </Pressable>
  );
}
