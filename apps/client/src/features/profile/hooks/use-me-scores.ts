/**
 * `useMeScores` — the master resume's unified job-independent scores
 * (Readiness + Quality + Style + Fit, each with its S/A/B/C/D/F rank),
 * from `GET /v1/me/scores`. Thin wrapper over the generated query so the
 * Desempenho hub and the header Readiness band share one cache entry.
 */

import { type GetV1MeScoresQueryResponse, useGetV1MeScores } from "@patch-careers/api-client";

export type MeScores = GetV1MeScoresQueryResponse;

export type UseMeScoresResult = {
  scores: MeScores | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  /** True once loaded and the user has no master resume + no fit yet. */
  isColdStart: boolean;
};

export function useMeScores(): UseMeScoresResult {
  const query = useGetV1MeScores();
  const scores = query.data;
  const isColdStart = !!scores && scores.resumeId === null && scores.fit.status === "never";

  return {
    scores,
    isPending: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
    isColdStart,
  };
}
