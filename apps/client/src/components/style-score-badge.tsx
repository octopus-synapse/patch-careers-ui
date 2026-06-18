/**
 * <StyleScoreBadge> — tappable Style Score pill for a resume template.
 *
 * Shows the template's live Style Score; tapping opens a sheet with the
 * per-bucket breakdown + issues, fetched on demand from
 * `GET /v1/resume-styles/:id`. Shared across the theme-selection surfaces
 * and the resumes list, so it lives at the app `components/` level (imports
 * the pure `@patch-careers/ui` chip/sheet + the data hook).
 */

import { useGetV1ResumeStylesId } from "@patch-careers/api-client";
import {
  type ScoreChipSize,
  Sheet,
  StyleScoreBreakdown,
  type StyleScoreBreakdownBucket,
  type StyleScoreBreakdownIssue,
  type StyleScoreSeverity,
  StyleScoreChip,
} from "@patch-careers/ui";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export type StyleScoreBadgeProps = {
  styleId: string;
  styleScore: number;
  size?: ScoreChipSize;
};

/** Readable fallback for an unmapped style issue code, e.g.
 * `STYLE_MULTI_COLUMN_LAYOUT` → "Multi column layout". The curated system
 * templates carry no issues, so this only surfaces for custom styles. */
function humanizeIssueCode(code: string): string {
  return code
    .replace(/^STYLE_/, "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function StyleScoreBadge({ styleId, styleScore, size = "sm" }: StyleScoreBadgeProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const detail = useGetV1ResumeStylesId(styleId, { query: { enabled: open } });

  const a11y = t("resumes.styleScore.a11y", { score: Math.round(styleScore) });
  const breakdown = detail.data?.styleScoreBreakdown;
  const buckets: StyleScoreBreakdownBucket[] = breakdown
    ? Object.entries(breakdown.buckets).map(([key, points]) => ({
        label: t(`resumes.styleScore.buckets.${key}`) || key,
        points,
      }))
    : [];
  const issues: StyleScoreBreakdownIssue[] = (breakdown?.issues ?? []).map((i) => ({
    label: humanizeIssueCode(i.code),
    severity: i.severity as StyleScoreSeverity,
  }));

  return (
    <>
      <StyleScoreChip
        score={styleScore}
        size={size}
        accessibilityLabel={a11y}
        onPress={() => setOpen(true)}
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t("resumes.styleScore.sheetTitle")}
        presentation="card"
      >
        {detail.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : detail.isError ? (
          <Text style={styles.error}>{t("resumes.styleScore.loadError")}</Text>
        ) : (
          <StyleScoreBreakdown
            score={styleScore}
            buckets={buckets}
            issues={issues}
            bucketsHeading={t("resumes.styleScore.bucketsHeading")}
            issuesHeading={t("resumes.styleScore.issuesHeading")}
            emptyIssuesLabel={t("resumes.styleScore.noIssues")}
            scoreAccessibilityLabel={a11y}
          />
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 24, alignItems: "center" },
  error: { paddingVertical: 12 },
});
