/**
 * <QualityScoreBadge> — compact, read-only overall Resume Quality pill for
 * a resume card in the list. Tapping the card navigates to the detail
 * screen (where the score becomes expandable + actionable), so this badge
 * itself is not interactive. Renders nothing until a score exists.
 */

import { ScoreChip } from "@patch-careers/ui";
import { useI18n } from "@/providers/i18n-provider";
import { useResumeQuality } from "../hooks/use-resume-quality";

export type QualityScoreBadgeProps = {
  resumeId: string;
  updatedAt?: string;
};

export function QualityScoreBadge({ resumeId, updatedAt }: QualityScoreBadgeProps) {
  const { t } = useI18n();
  const quality = useResumeQuality(resumeId, updatedAt ? { updatedAt } : {});

  if (quality.overallScore === null) return null;

  return (
    <ScoreChip
      score={quality.overallScore}
      size="sm"
      accessibilityLabel={t("resumes.quality.a11y", { score: quality.overallScore })}
    />
  );
}
