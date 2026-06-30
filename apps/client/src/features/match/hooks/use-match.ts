/**
 * Reads the Match Score for a (résumé, job) pair. Cached server-side, computed
 * on demand — external listings are matchable via the job-match engine's
 * external loader. Gated by `resumeId` presence; the breakdown gates on the
 * fit profile separately (via `useFitStatus`) so we never fire this without a
 * fit profile and trip the 403.
 */
import {
  type GetV1MatchResumeIdJobId200,
  useGetV1MatchResumeIdJobId,
} from "@patch-careers/api-client";

export function useMatch(
  resumeId: string | undefined,
  jobId: string,
): {
  breakdown: GetV1MatchResumeIdJobId200 | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const enabled = Boolean(resumeId);
  const query = useGetV1MatchResumeIdJobId(resumeId ?? "", jobId, {
    query: { enabled, retry: false },
  });
  return {
    breakdown: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
