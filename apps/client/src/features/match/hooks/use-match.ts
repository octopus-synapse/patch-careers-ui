/**
 * Reads the Match Score for a (resume, job) pair. Cached server-side, computed
 * on demand — external listings are matchable via the job-match engine's
 * external loader. Requires a resume; Fit is optional.
 */
import {
  type GetV1MatchResumeIdJobId200,
  useGetV1MatchResumeIdJobId,
} from "@patch-careers/api-client";
import { usePatchPlan } from "@/features/billing";

export function useMatch(
  resumeId: string | undefined,
  jobId: string,
): {
  breakdown: GetV1MatchResumeIdJobId200 | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { canUsePaid } = usePatchPlan();
  const enabled = canUsePaid && Boolean(resumeId);
  const query = useGetV1MatchResumeIdJobId(resumeId ?? "", jobId, {
    query: { enabled, retry: false },
  });
  return {
    breakdown: canUsePaid ? query.data : undefined,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
