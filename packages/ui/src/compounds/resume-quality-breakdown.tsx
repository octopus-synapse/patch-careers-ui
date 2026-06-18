/**
 * `<ResumeQualityBreakdown>` — presentational body for the Resume Quality
 * Score panel. Shows the overall score, the two sub-scores (Completeness +
 * Content/AI) and the actionable issues list. All copy is passed in
 * already-localised by the caller — this package stays i18n-free. Pure: no
 * data fetching, no expand/collapse state.
 *
 * Issues with an `onPress` render as buttons (deep-link into the section
 * editor at the feature layer); the rest render as plain rows.
 */

import { intent as intentTokens } from "@patch-careers/tokens";
import { Pressable } from "react-native";
import { TStack } from "../internal/tamagui-shim";
import { useThemeName } from "../internal/use-theme-name";
import { Divider } from "../primitives/divider";
import { Text } from "../primitives/text";
import { ScoreChip } from "./score-chip";

export type QualitySeverity = "low" | "medium" | "high";

export type QualitySubScore = {
  label: string;
  /** `null` → unavailable (e.g. AI content score when the analyzer is off). */
  score: number | null;
  /** Shown in place of the chip when `score` is null. */
  unavailableLabel: string;
};

export type QualityBreakdownIssue = {
  label: string;
  severity: QualitySeverity;
  /** Optional secondary line — e.g. the AI's specific per-bullet rewrite
   * hint under the category label. */
  detail?: string;
  /** When set, the row becomes a button (tap → open the section editor). */
  onPress?: () => void;
};

export type ResumeQualityBreakdownProps = {
  overallScore: number;
  subScores: QualitySubScore[];
  issues: QualityBreakdownIssue[];
  subScoresHeading: string;
  issuesHeading: string;
  emptyIssuesLabel: string;
  /** Shown when the AI content sub-score is unavailable. */
  aiUnavailableNote?: string;
  scoreAccessibilityLabel: string;
};

const SEVERITY_TO_INTENT = {
  high: "danger",
  medium: "accent",
  low: "neutral",
} as const;

export function ResumeQualityBreakdown({
  overallScore,
  subScores,
  issues,
  subScoresHeading,
  issuesHeading,
  emptyIssuesLabel,
  aiUnavailableNote,
  scoreAccessibilityLabel,
}: ResumeQualityBreakdownProps) {
  const themeName = useThemeName();

  return (
    <TStack gap={18}>
      <ScoreChip score={overallScore} size="lg" accessibilityLabel={scoreAccessibilityLabel} />

      <TStack gap={10}>
        <Text preset="label">{subScoresHeading}</Text>
        {subScores.map((s) => (
          <TStack
            key={s.label}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text preset="body">{s.label}</Text>
            {s.score === null ? (
              <Text preset="label">{s.unavailableLabel}</Text>
            ) : (
              <ScoreChip score={s.score} size="sm" accessibilityLabel={`${s.label} ${s.score}`} />
            )}
          </TStack>
        ))}
        {aiUnavailableNote ? <Text preset="caption">{aiUnavailableNote}</Text> : null}
      </TStack>

      <Divider />

      <TStack gap={10}>
        <Text preset="label">{issuesHeading}</Text>
        {issues.length === 0 ? (
          <Text preset="caption">{emptyIssuesLabel}</Text>
        ) : (
          issues.map((issue, index) => {
            const tokens = intentTokens[SEVERITY_TO_INTENT[issue.severity]][themeName];
            const key = `${issue.severity}-${issue.label}-${index}`;
            const content = (
              <>
                <TStack
                  width={8}
                  height={8}
                  borderRadius={999}
                  backgroundColor={tokens.bg}
                  marginTop={5}
                />
                <TStack flex={1} gap={2}>
                  <Text preset="body">{issue.label}</Text>
                  {issue.detail ? <Text preset="caption">{issue.detail}</Text> : null}
                </TStack>
              </>
            );
            return issue.onPress ? (
              <Pressable
                key={key}
                onPress={issue.onPress}
                accessibilityRole="button"
                accessibilityLabel={issue.label}
                hitSlop={6}
              >
                <TStack flexDirection="row" alignItems="flex-start" gap={8}>
                  {content}
                </TStack>
              </Pressable>
            ) : (
              <TStack key={key} flexDirection="row" alignItems="flex-start" gap={8}>
                {content}
              </TStack>
            );
          })
        )}
      </TStack>
    </TStack>
  );
}
