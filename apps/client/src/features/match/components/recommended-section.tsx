/**
 * <RecommendedSection> — the "Recomendadas pra você" strip at the top of the
 * Jobs tab. Three states:
 *   - no/expired fit profile → blur+lock <MatchGate> → /fit-questionnaire
 *   - fit profile, recommendations ready → horizontal carousel of match cards
 *   - fit profile, nothing precomputed yet (cron hasn't run) → collapses
 * Fit-status loading collapses too, to avoid a flash.
 */
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFitStatus } from "@/features/fit";
import { useI18n } from "@/providers/i18n-provider";
import { useRecommendedJobs } from "../hooks/use-recommended-jobs";
import { useMt } from "../lib/styles";
import type { RecommendedJob } from "../types";
import { MatchGate } from "./match-gate";
import { RecommendedJobCard } from "./recommended-job-card";

export function RecommendedSection({
  onOpenJob,
}: {
  onOpenJob: (job: RecommendedJob) => void;
}): ReactElement | null {
  const s = useMt();
  const { t } = useI18n();
  const router = useRouter();
  const fit = useFitStatus();
  const status = fit.data?.status;
  const responded = status === "responded";
  const recs = useRecommendedJobs(responded);

  // Avoid a flash while the fit lifecycle resolves.
  if (fit.isPending) return null;

  if (!responded) {
    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>{t("match.recommended.title")}</Text>
        <MatchGate
          title={t("match.gate.title")}
          body={t("match.gate.body")}
          ctaLabel={status === "expired" ? t("match.gate.ctaExpired") : t("match.gate.ctaNever")}
          onPress={() => router.push("/fit-questionnaire")}
        />
      </View>
    );
  }

  // Responded but nothing precomputed yet → collapse silently.
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
            matchLabel={t("match.matchLabel")}
            onPress={() => onOpenJob(job)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
