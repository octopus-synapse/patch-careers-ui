/**
 * Reads the precomputed match-ranked recommendations (`/v1/jobs/recommended`,
 * backed by the job-match worker's top-N cache). Gated by `enabled` so we only
 * fetch once the caller has a fit profile — the section shows the gate
 * otherwise. Empty until the worker has run for the user.
 */
import { useGetV1JobsRecommended } from "@patch-careers/api-client";
import type { RecommendedJob } from "../types";

export function useRecommendedJobs(enabled: boolean): {
  jobs: RecommendedJob[];
  isLoading: boolean;
  isError: boolean;
} {
  const query = useGetV1JobsRecommended(undefined, { query: { enabled } });
  return {
    jobs: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
