/**
 * <MatchBreakdown> — the Match Score panel on a job detail. Fit-gated: shows
 * the blur/lock gate until the user has a fit profile, then the overall score
 * ring + the four sub-scores, the skill gaps (deep-linking to improve the
 * résumé), and an AI-tailor CTA. Culture is never surfaced — only the
 * role-derived fit signal feeds the "Perfil" sub-score.
 */
import { usePostV1ResumesResumeIdTailor } from "@patch-careers/api-client";
import { ScoreExplainSheet, ScoreRing, Text, useToast, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { Info } from "lucide-react-native";
import { type ReactElement, useCallback, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useFitStatus } from "@/features/fit";
import { useI18n } from "@/providers/i18n-provider";
import { useDefaultMatchResume } from "../hooks/use-default-match-resume";
import { useMatch } from "../hooks/use-match";
import { useMt } from "../lib/styles";
import { MatchGate } from "./match-gate";

export type MatchBreakdownJob = {
  id: string;
  title: string;
  company: string;
  description: string | null;
};

const SUB_KEYS = ["keyword", "requirements", "semantic", "fit"] as const;

export function MatchBreakdown({ job }: { job: MatchBreakdownJob }): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const s = useMt();
  const router = useRouter();
  const toast = useToast();
  const fit = useFitStatus();
  const responded = fit.data?.status === "responded";
  const { resumeId, quality } = useDefaultMatchResume();
  const match = useMatch(responded ? resumeId : undefined, job.id);
  const tailor = usePostV1ResumesResumeIdTailor();
  // Backend gates tailoring on the résumé's Quality Score (min 50); reflect it.
  const tailorLocked = quality !== null && quality < 50;
  const [explainOpen, setExplainOpen] = useState(false);

  const onTailor = useCallback(() => {
    if (!resumeId || tailor.isPending || tailorLocked) return;
    tailor.mutate(
      {
        resumeId,
        data: {
          jobTitle: job.title,
          jobCompany: job.company,
          ...(job.description ? { jobDescription: job.description } : {}),
        },
      },
      {
        onSuccess: () =>
          toast.show({ title: t("match.breakdown.tailorSuccess"), intent: "success" }),
        onError: () => toast.show({ title: t("match.breakdown.tailorError"), intent: "danger" }),
      },
    );
  }, [resumeId, tailor, tailorLocked, job, toast, t]);

  if (fit.isPending) return null;

  const heading = (
    <Text
      fontFamily={fonts.sans}
      fontSize={10}
      fontWeight="600"
      letterSpacing={1.8}
      textTransform="uppercase"
      color={palette.muted}
    >
      {t("match.breakdown.heading")}
    </Text>
  );

  if (!responded) {
    return (
      <YStack gap={14}>
        {heading}
        <MatchGate
          title={t("match.gate.title")}
          body={t("match.gate.body")}
          ctaLabel={
            fit.data?.status === "expired" ? t("match.gate.ctaExpired") : t("match.gate.ctaNever")
          }
          onPress={() => router.push("/fit-questionnaire")}
        />
      </YStack>
    );
  }

  if (!resumeId) {
    return (
      <YStack gap={10}>
        {heading}
        <Text fontFamily={fonts.sans} fontSize={14} color={palette.muted}>
          {t("match.breakdown.noResume")}
        </Text>
      </YStack>
    );
  }

  if (match.isLoading) {
    return (
      <YStack gap={14}>
        {heading}
        <YStack paddingVertical={16} alignItems="center">
          <ActivityIndicator color={palette.ink} />
        </YStack>
      </YStack>
    );
  }

  if (match.isError || !match.breakdown) {
    return (
      <YStack gap={10}>
        {heading}
        <Text fontFamily={fonts.sans} fontSize={14} color={palette.muted}>
          {t("match.breakdown.error")}
        </Text>
        <Pressable accessibilityRole="button" onPress={match.refetch} hitSlop={8}>
          <Text fontFamily={fonts.sans} fontSize={14} fontWeight="600" color={palette.accent}>
            {t("match.breakdown.retry")}
          </Text>
        </Pressable>
      </YStack>
    );
  }

  const b = match.breakdown;
  const gaps = b.subScores.keyword.detail?.missing ?? [];

  return (
    <YStack gap={16}>
      <XStack alignItems="center" justifyContent="space-between">
        {heading}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("match.explain.a11y")}
          onPress={() => setExplainOpen(true)}
          hitSlop={8}
        >
          <Info size={16} color={palette.muted} />
        </Pressable>
      </XStack>
      <XStack alignItems="center" gap={16}>
        <ScoreRing score={b.overallScore} grade />
        <YStack flex={1} gap={7}>
          {SUB_KEYS.map((key) => {
            const score = b.subScores[key].score;
            return (
              <XStack key={key} alignItems="center" justifyContent="space-between">
                <Text fontFamily={fonts.sans} fontSize={13} color={palette.body}>
                  {t(`match.breakdown.sub.${key}`)}
                </Text>
                <Text fontFamily={fonts.mono} fontSize={13} color={palette.ink}>
                  {score === null ? "—" : score}
                </Text>
              </XStack>
            );
          })}
        </YStack>
      </XStack>

      {gaps.length > 0 ? (
        <YStack gap={10}>
          <Text
            fontFamily={fonts.sans}
            fontSize={10}
            fontWeight="600"
            letterSpacing={1.8}
            textTransform="uppercase"
            color={palette.muted}
          >
            {t("match.breakdown.gapsTitle")}
          </Text>
          <XStack flexWrap="wrap" gap={8}>
            {gaps.map((g) => (
              <Chip key={g} label={g} />
            ))}
          </XStack>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/resume/[id]", params: { id: resumeId } })}
            hitSlop={8}
          >
            <Text fontFamily={fonts.sans} fontSize={14} fontWeight="600" color={palette.accent}>
              {t("match.breakdown.improveCta")}
            </Text>
          </Pressable>
        </YStack>
      ) : null}

      <YStack gap={8}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: tailor.isPending || tailorLocked }}
          onPress={onTailor}
          disabled={tailor.isPending || tailorLocked}
          style={[s.tailorBtn, tailor.isPending || tailorLocked ? s.tailorBtnDisabled : null]}
        >
          {tailor.isPending ? <ActivityIndicator size="small" color={palette.body} /> : null}
          <Text fontFamily={fonts.sans} fontSize={14} fontWeight="600" color={palette.ink}>
            {tailor.isPending ? t("match.breakdown.tailoring") : t("match.breakdown.tailorCta")}
          </Text>
        </Pressable>
        {tailorLocked ? (
          <Text
            fontFamily={fonts.sans}
            fontSize={12}
            lineHeight={17}
            color={palette.muted}
            textAlign="center"
          >
            {t("match.breakdown.tailorLocked")}
          </Text>
        ) : null}
      </YStack>

      <ScoreExplainSheet
        open={explainOpen}
        onOpenChange={setExplainOpen}
        title={t("match.explain.title")}
        score={b.overallScore}
        grade
        sections={SUB_KEYS.map((key) => ({
          label: t(`match.breakdown.sub.${key}`),
          body: t(`match.explain.${key}`),
          trailing: `${Math.round((b.effectiveWeights[key] ?? 0) * 100)}%`,
        }))}
        footnote={t("match.explain.footnote")}
      />
    </YStack>
  );
}

function Chip({ label }: { label: string }): ReactElement {
  const s = useMt();
  const palette = useEditorialPalette();
  return (
    <View style={s.chip}>
      <Text fontFamily={fonts.sans} fontSize={12} color={palette.body}>
        {label}
      </Text>
    </View>
  );
}
