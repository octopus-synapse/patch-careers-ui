/**
 * <RecommendedSection> — the "Recomendadas pra você" strip at the top of the
 * Jobs tab. Three states:
 *   - recommendations ready → horizontal carousel of match cards
 *   - nothing precomputed yet (cron hasn't run) → collapses
 */
import type { ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useRecommendedJobs } from "../hooks/use-recommended-jobs";
import { useMt } from "../lib/styles";
import type { RecommendedJob } from "../types";
import { RecommendedJobCard } from "./recommended-job-card";

export function RecommendedSection({
  onOpenJob,
}: {
  onOpenJob: (job: RecommendedJob) => void;
}): ReactElement | null {
  const s = useMt();
  const { t } = useI18n();
  const recs = useRecommendedJobs(true);

  // Nothing precomputed yet → collapse silently.
  if (recs.jobs.length === 0) return null;

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t("match.recommended.title")}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.carousel}
      >
        {recs.jobs.map((job) => (
          <RecommendedJobCard
            key={job.id}
            job={job}
            matchLabel={t("match.compatLabel")}
            onPress={() => onOpenJob(job)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
