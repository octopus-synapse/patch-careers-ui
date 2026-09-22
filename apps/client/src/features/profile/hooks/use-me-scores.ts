/**
 * `useMeScores` — the master resume's unified job-independent scores
 * (Readiness + Quality + Style),
 * from `GET /v1/me/scores`. Thin wrapper over the generated query so the
 * Desempenho hub and the header Readiness band share one cache entry.
 */

import { type GetV1MeScoresQueryResponse, useGetV1MeScores } from "@patch-careers/api-client";
import { usePatchPlan } from "@/features/billing/use-patch-plan";

export type MeScores = GetV1MeScoresQueryResponse;

export type UseMeScoresResult = {
  scores: MeScores | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  /** True once loaded and the user has no master resume yet. */
  isColdStart: boolean;
};

export function useMeScores(): UseMeScoresResult {
  const billing = usePatchPlan();
  const { canUsePaid } = billing;
  const query = useGetV1MeScores({ query: { enabled: canUsePaid } });
  const scores = canUsePaid ? query.data : undefined;
  const isColdStart = !!scores && scores.resumeId === null;

  return {
    scores,
    isPending: (billing.isPending && !billing.data) || (canUsePaid && query.isPending),
    isError: billing.isError || query.isError,
    refetch: () => void query.refetch(),
    isColdStart,
  };
}
