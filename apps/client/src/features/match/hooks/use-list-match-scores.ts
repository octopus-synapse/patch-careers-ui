/**
 * Compatibility scores for a page of listings — batches the visible ids
 * through `POST /v1/match/batch` (compute-on-miss, server-cached 24h per
 * pair; embeddings 7d). Gated client-side by a responded fit profile and
 * a default resume, mirroring the server's hard invariant; chunked at 20
 * (the endpoint's cap = one list page).
 *
 * Returns a jobId → overallScore record. Ids that failed to score are
 * simply absent — the row renders without a chip.
 */
import { postV1MatchBatch } from "@patch-careers/api-client";
import { useQueries } from "@tanstack/react-query";
import { useFitStatus } from "@/features/fit";
import { useDefaultMatchResume } from "./use-default-match-resume";

const CHUNK_SIZE = 20;
const STALE_MS = 10 * 60_000;

export function useListMatchScores(jobIds: readonly string[]): Record<string, number> {
  const fit = useFitStatus();
  const responded = fit.data?.status === "responded";
  const { resumeId } = useDefaultMatchResume();

  const chunks: string[][] = [];
  for (let i = 0; i < jobIds.length; i += CHUNK_SIZE) {
    chunks.push([...jobIds.slice(i, i + CHUNK_SIZE)]);
  }

  const queries = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: ["match-batch", resumeId, chunk] as const,
      queryFn: () => postV1MatchBatch({ resumeId: resumeId ?? "", jobIds: chunk }),
      enabled: responded && Boolean(resumeId) && chunk.length > 0,
      staleTime: STALE_MS,
      retry: false,
    })),
  });

  const scores: Record<string, number> = {};
  for (const query of queries) {
    for (const score of query.data?.scores ?? []) {
      scores[score.jobId] = score.overallScore;
    }
  }
  return scores;
}
