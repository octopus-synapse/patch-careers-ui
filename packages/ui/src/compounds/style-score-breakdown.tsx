/**
 * `<StyleScoreBreakdown>` — presentational body for the Style Score sheet.
 *
 * Shows the headline score, the per-bucket points (structure / typography /
 * contrast / decorations) and the list of failed criteria ("issues"). All
 * copy is passed in already-localised by the caller — this package stays
 * i18n-free. Pure: no data fetching, no open/close state.
 */

import { intent as intentTokens } from "@patch-careers/tokens";
import { TStack } from "../internal/tamagui-shim";
import { useThemeName } from "../internal/use-theme-name";
import { Divider } from "../primitives/divider";
import { Text } from "../primitives/text";
import { StyleScoreChip } from "./style-score-chip";

export type StyleScoreBreakdownBucket = { label: string; points: number };
export type StyleScoreSeverity = "low" | "medium" | "high";
export type StyleScoreBreakdownIssue = { label: string; severity: StyleScoreSeverity };

export type StyleScoreBreakdownProps = {
  score: number;
  buckets: StyleScoreBreakdownBucket[];
  issues: StyleScoreBreakdownIssue[];
  /** Localised section captions + empty state. */
  bucketsHeading: string;
  issuesHeading: string;
  emptyIssuesLabel: string;
  scoreAccessibilityLabel?: string;
};

const SEVERITY_TO_INTENT = {
  high: "danger",
  medium: "accent",
  low: "neutral",
} as const;

export function StyleScoreBreakdown({
  score,
  buckets,
  issues,
  bucketsHeading,
  issuesHeading,
  emptyIssuesLabel,
  scoreAccessibilityLabel,
}: StyleScoreBreakdownProps) {
  const themeName = useThemeName();

  return (
    <TStack gap={18}>
      <StyleScoreChip
        score={score}
        size="lg"
        {...(scoreAccessibilityLabel ? { accessibilityLabel: scoreAccessibilityLabel } : {})}
      />

      <TStack gap={10}>
        <Text preset="label">{bucketsHeading}</Text>
        {buckets.map((b) => (
          <TStack
            key={b.label}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text preset="body">{b.label}</Text>
            <Text preset="label">{b.points}</Text>
          </TStack>
        ))}
      </TStack>

      <Divider />

      <TStack gap={10}>
        <Text preset="label">{issuesHeading}</Text>
        {issues.length === 0 ? (
          <Text preset="caption">{emptyIssuesLabel}</Text>
        ) : (
          issues.map((i) => {
            const tokens = intentTokens[SEVERITY_TO_INTENT[i.severity]][themeName];
            return (
              <TStack
                key={`${i.severity}-${i.label}`}
                flexDirection="row"
                alignItems="center"
                gap={8}
              >
                <TStack width={8} height={8} borderRadius={999} backgroundColor={tokens.bg} />
                <Text preset="body">{i.label}</Text>
              </TStack>
            );
          })
        )}
      </TStack>
    </TStack>
  );
}
