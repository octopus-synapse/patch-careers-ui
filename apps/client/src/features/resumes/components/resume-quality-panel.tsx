/**
 * <ResumeQualityPanel> — the Resume Quality surface on the detail screen.
 * A clean editorial gauge (always visible) with the two sub-scores in mono,
 * followed by the actionable issues as tappable EditableRows: tapping an issue
 * deep-links straight into the matching section editor (1-tap fix) via
 * `onOpenIssue`. Shows a "calculating" spinner while the server recomputes and
 * an "AI unavailable" note when the content sub-score is absent. Renders
 * nothing until a score exists.
 */

import {
  ScoreExplainSheet,
  type ScoreSeverity,
  scoreGrade,
  Text,
  XStack,
  YStack,
} from "@patch-careers/ui";
import {
  EditableRow,
  editorialFonts as fonts,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { Info } from "lucide-react-native";
import { type ReactElement, type ReactNode, useMemo, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useRankPulse } from "../hooks/use-rank-pulse";
import { useResumeQuality } from "../hooks/use-resume-quality";
import { ScoreRing } from "./score-ring";

export type ResumeQualityPanelProps = {
  resumeId: string;
  /** Resume `updatedAt` — drives the stale/"calculating" detection. */
  updatedAt?: string;
  /** Deep-link an issue to the section/item editor. */
  onOpenIssue?: (sectionKey: string, itemIndex?: number) => void;
};

type PanelIssue = {
  id: string;
  label: string;
  severity: ScoreSeverity;
  detail?: string | undefined;
  onPress?: (() => void) | undefined;
};

/** Readable fallback for an unmapped issue code. */
function humanizeIssueCode(code: string): string {
  return code
    .replace(/^(CODE|AI)_/, "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function ResumeQualityPanel({
  resumeId,
  updatedAt,
  onOpenIssue,
}: ResumeQualityPanelProps): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const quality = useResumeQuality(resumeId, updatedAt ? { updatedAt } : {});
  const [explainOpen, setExplainOpen] = useState(false);
  const rankDelta = useRankPulse(resumeId, quality.overallScore);

  const overall = quality.overallScore;
  const issues: PanelIssue[] = useMemo(() => {
    if (quality.state === "empty" || quality.state === "error") return [];
    return quality.issues.map((issue) => {
      const label =
        t(`resumes.quality.issues.${issue.code}`) ||
        issue.freeformMessage ||
        humanizeIssueCode(issue.code);
      const detail =
        issue.freeformMessage && issue.freeformMessage !== label
          ? issue.freeformMessage
          : undefined;
      const sectionKey = issue.context?.sectionKey;
      return {
        id: `${issue.code}:${sectionKey ?? ""}:${issue.context?.itemIndex ?? ""}`,
        label,
        severity: issue.severity as ScoreSeverity,
        detail,
        onPress:
          onOpenIssue && sectionKey
            ? () => onOpenIssue(sectionKey, issue.context?.itemIndex)
            : undefined,
      };
    });
  }, [quality, t, onOpenIssue]);

  // Empty (no snapshot yet) / error → nothing to show.
  if (quality.state === "empty" || quality.state === "error") return null;
  if (quality.state === "loading" || overall === null) {
    return (
      <YStack paddingVertical={16} alignItems="center">
        <ActivityIndicator color={palette.ink} />
      </YStack>
    );
  }

  const calculating = quality.state === "calculating";
  const subScoreText = [
    `${t("resumes.quality.completeness")} ${formatScore(quality.completenessScore, t)}`,
    `${t("resumes.quality.content")} ${formatScore(quality.contentQualityScore, t)}`,
  ].join("   ·   ");

  return (
    <YStack gap={18}>
      {rankDelta ? (
        <Text
          fontFamily={fonts.sans}
          fontSize={13}
          fontWeight="600"
          color={rankDelta === "up" ? palette.success : palette.warn}
        >
          {t(`resumes.quality.rank.${rankDelta}`, { grade: scoreGrade(overall) })}
        </Text>
      ) : null}
      <XStack alignItems="center" gap={16}>
        <ScoreRing score={overall} />
        <YStack flex={1} gap={5}>
          <Text
            fontFamily={fonts.sans}
            fontSize={10}
            fontWeight="600"
            letterSpacing={1.8}
            textTransform="uppercase"
            color={palette.muted}
          >
            {t("resumes.quality.overallLabel")}
          </Text>
          <Text fontFamily={fonts.mono} fontSize={13} letterSpacing={0.2} color={palette.body}>
            {subScoreText}
          </Text>
          {calculating ? (
            <XStack alignItems="center" gap={8}>
              <ActivityIndicator size="small" color={palette.muted} />
              <Text fontFamily={fonts.sans} fontSize={11} letterSpacing={0.3} color={palette.muted}>
                {t("resumes.quality.calculating")}
              </Text>
            </XStack>
          ) : null}
        </YStack>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("resumes.quality.explain.a11y")}
          onPress={() => setExplainOpen(true)}
          hitSlop={8}
        >
          <Info size={16} color={palette.muted} />
        </Pressable>
      </XStack>

      <YStack gap={10}>
        <Text
          fontFamily={fonts.sans}
          fontSize={10}
          fontWeight="600"
          letterSpacing={1.8}
          textTransform="uppercase"
          color={palette.muted}
        >
          {t("resumes.quality.issuesHeading")}
        </Text>
        {issues.length === 0 ? (
          <Text
            fontFamily={fonts.sans}
            fontSize={14}
            lineHeight={20}
            fontStyle="italic"
            color={palette.subtle}
          >
            {t("resumes.quality.noIssues")}
          </Text>
        ) : (
          issues.map((issue) => {
            const dotColor =
              issue.severity === "high"
                ? palette.danger
                : issue.severity === "medium"
                  ? palette.warn
                  : palette.subtle;
            const dot: ReactNode = (
              <YStack width={8} height={8} borderRadius={4} backgroundColor={dotColor} />
            );
            return (
              <EditableRow
                key={issue.id}
                label={issue.label}
                value={issue.detail}
                leading={dot}
                onPress={issue.onPress ?? (() => {})}
                {...(issue.onPress ? {} : { trailing: <YStack /> })}
              />
            );
          })
        )}
      </YStack>

      {quality.state === "aiUnavailable" ? (
        <Text fontFamily={fonts.sans} fontSize={12.5} lineHeight={18} color={palette.subtle}>
          {t("resumes.quality.aiUnavailable")}
        </Text>
      ) : null}

      <ScoreExplainSheet
        open={explainOpen}
        onOpenChange={setExplainOpen}
        title={t("resumes.quality.explain.title")}
        {...(overall !== null ? { score: overall } : {})}
        grade
        sections={[
          {
            label: t("resumes.quality.completeness"),
            body: t("resumes.quality.explain.completeness"),
            trailing: formatScore(quality.completenessScore, t),
          },
          {
            label: t("resumes.quality.content"),
            body: t("resumes.quality.explain.content"),
            trailing: formatScore(quality.contentQualityScore, t),
          },
        ]}
        footnote={t("resumes.quality.explain.footnote")}
      />
    </YStack>
  );
}

/** A sub-score number, or the short "unavailable" label when null. */
function formatScore(score: number | null, t: (key: string) => string): string {
  return score === null ? t("resumes.quality.unavailableShort") : String(Math.round(score));
}
