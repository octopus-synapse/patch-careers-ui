/**
 * Picks the résumé to match against by default: the one with the highest
 * Resume Quality Score (the user's strongest CV), falling back to the
 * master/primary résumé, then the first. Quality is fanned over the user's
 * résumés (capped at a handful of slots) via `useQueries`, best-effort — the
 * match doesn't block on those fetches; it upgrades to the best as they land.
 */
import { getV1ResumesResumeIdQualityQueryOptions } from "@patch-careers/api-client";
import { useQueries } from "@tanstack/react-query";
import { useMasterResumeId, useResumeList } from "@/features/resumes";

export function useDefaultMatchResume(): {
  resumeId: string | undefined;
  /** Overall Quality Score of the chosen résumé (null when not yet known). */
  quality: number | null;
  isLoading: boolean;
} {
  const { resumes, isLoading: listLoading } = useResumeList();
  const master = useMasterResumeId();

  const qualityQueries = useQueries({
    queries: resumes.map((r) => ({
      ...getV1ResumesResumeIdQualityQueryOptions(r.id),
      retry: false,
      staleTime: 5 * 60_000,
    })),
  });

  let bestId: string | undefined;
  let bestScore = -1;
  resumes.forEach((r, i) => {
    const score = qualityQueries[i]?.data?.overallScore ?? -1;
    if (score > bestScore) {
      bestScore = score;
      bestId = r.id;
    }
  });

  const resumeId = bestId ?? master.resumeId ?? resumes[0]?.id;
  return {
    resumeId,
    quality: bestScore >= 0 ? bestScore : null,
    isLoading: listLoading || master.isLoading,
  };
}
