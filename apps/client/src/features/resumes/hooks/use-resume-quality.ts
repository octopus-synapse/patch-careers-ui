/**
 * Data + state derivation for the Resume Quality Score panel/badge.
 *
 * Wraps the generated `GET /v1/resumes/:id/quality` hook and the
 * synchronous recompute mutation, and derives a single `state` the UI
 * switches on. Because the server recomputes asynchronously after an edit
 * (debounced worker), we compare the snapshot's `computedAt` against the
 * resume's `updatedAt`: while the snapshot is stale we report
 * `"calculating"` and poll until it catches up.
 */

import {
  type GetV1ResumesResumeIdQuality200,
  getV1ResumesResumeIdQualityQueryKey,
  useGetV1ResumesResumeIdQuality,
  usePostV1ResumesResumeIdQualityRecompute,
} from "@patch-careers/api-client";
import { useQueryClient } from "@tanstack/react-query";

export type ResumeQualityState =
  | "loading"
  | "calculating"
  | "ok"
  | "aiUnavailable"
  | "empty"
  | "error";

export type ResumeQualityIssue = GetV1ResumesResumeIdQuality200["issues"][number];

export type UseResumeQualityResult = {
  data: GetV1ResumesResumeIdQuality200 | undefined;
  overallScore: number | null;
  completenessScore: number | null;
  contentQualityScore: number | null;
  issues: ResumeQualityIssue[];
  state: ResumeQualityState;
  recompute: () => Promise<void>;
  isRecomputing: boolean;
};

const POLL_MS = 3000;

export function useResumeQuality(
  resumeId: string,
  opts: { enabled?: boolean; updatedAt?: string } = {},
): UseResumeQualityResult {
  const queryClient = useQueryClient();
  const updatedAtMs = opts.updatedAt ? Date.parse(opts.updatedAt) : null;

  const query = useGetV1ResumesResumeIdQuality(resumeId, {
    query: {
      enabled: opts.enabled ?? true,
      // Poll while the server-side recompute hasn't caught up with the
      // latest edit, then stop.
      refetchInterval: (q) => {
        const data = q.state.data as GetV1ResumesResumeIdQuality200 | undefined;
        if (!data || updatedAtMs === null) return false;
        return Date.parse(data.computedAt) < updatedAtMs ? POLL_MS : false;
      },
    },
  });

  const recomputeMutation = usePostV1ResumesResumeIdQualityRecompute();

  const data = query.data;
  const isStale = !!(data && updatedAtMs !== null && Date.parse(data.computedAt) < updatedAtMs);

  let state: ResumeQualityState;
  if (query.isLoading) {
    state = "loading";
  } else if (query.isError || !data) {
    // A missing snapshot (404 on a not-yet-scored resume) and a transient
    // error both collapse here; the panel/badge render nothing.
    // TODO(empty-initial-state): a dedicated near-empty-resume nudge.
    state = query.isError ? "error" : "empty";
  } else if (isStale || query.isRefetching || recomputeMutation.isPending) {
    state = "calculating";
  } else if (data.contentQualityScore === null) {
    state = "aiUnavailable";
  } else {
    state = "ok";
  }

  const recompute = async (): Promise<void> => {
    await recomputeMutation.mutateAsync({ resumeId });
    await queryClient.invalidateQueries({
      queryKey: getV1ResumesResumeIdQualityQueryKey(resumeId),
    });
  };

  return {
    data,
    overallScore: data?.overallScore ?? null,
    completenessScore: data?.completenessScore ?? null,
    contentQualityScore: data?.contentQualityScore ?? null,
    issues: data?.issues ?? [],
    state,
    recompute,
    isRecomputing: recomputeMutation.isPending,
  };
}
