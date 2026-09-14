/**
 * Reads the precomputed match-ranked recommendations (`/v1/jobs/recommended`,
 * backed by the job-match worker's top-N cache). Empty until the worker
 * has run for the user. Fit is optional for viewing Match.
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
