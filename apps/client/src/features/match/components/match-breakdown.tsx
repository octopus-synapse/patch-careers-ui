/**
 * <MatchBreakdown> — the compatibility panel on a job detail. Shows the
 * overall score ring + available sub-scores and skill gaps (deep-linking
 * to improve the resume). Tailoring moved into the job detail's apply flow.
 * Only job-related evidence contributes to candidate Match.
 */
import { ScoreExplainSheet, ScorePanel, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Info } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useAppRouter } from "@/navigation/use-app-router";
import { useI18n } from "@/providers/i18n-provider";
import { useDefaultMatchResume } from "../hooks/use-default-match-resume";
import { useMatch } from "../hooks/use-match";
import { useMt } from "../lib/styles";

export type MatchBreakdownJob = {
  id: string;
  title: string;
  company: string;
  description: string | null;
};

const SUB_KEYS = ["keyword", "requirements", "semantic"] as const;

export function MatchBreakdown({ job }: { job: MatchBreakdownJob }): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const router = useAppRouter();
  const { resumeId, isLoading: resumeLoading } = useDefaultMatchResume();
  const match = useMatch(resumeId, job.id);
  const [explainOpen, setExplainOpen] = useState(false);

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

  if (resumeLoading || match.isLoading) {
    return (
      <YStack gap={14}>
        {heading}
        <YStack paddingVertical={16} alignItems="center">
          <ActivityIndicator color={palette.ink} />
        </YStack>
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
  const gaps = [
    ...new Set([
      ...(b.subScores.keyword.detail?.missing ?? []),
      ...(b.subScores.requirements.detail?.missingSlots ?? []),
    ]),
  ];

  return (
    <>
      <ScorePanel
        labelPlacement="header"
        label={t("match.breakdown.heading")}
        score={b.overallScore}
        accessibilityLabel={t("match.breakdown.a11y", { score: `${b.overallScore}%` })}
        grade
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("match.explain.a11y")}
            onPress={() => setExplainOpen(true)}
            hitSlop={8}
          >
            <Info size={16} color={palette.muted} />
          </Pressable>
        }
        details={SUB_KEYS.map((key) => {
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
      >
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
          {gaps.length > 0 ? (
            <XStack flexWrap="wrap" gap={8}>
              {gaps.map((g) => (
                <Chip key={g} label={g} />
              ))}
            </XStack>
          ) : (
            <Text fontFamily={fonts.sans} fontSize={13} lineHeight={20} color={palette.body}>
              {t("match.breakdown.noGaps")}
            </Text>
          )}
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
      </ScorePanel>

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
    </>
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
