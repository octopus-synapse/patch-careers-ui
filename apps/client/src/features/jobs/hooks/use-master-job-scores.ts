import { postV1MatchBatch } from "@patch-careers/api-client";
import { type QueryClient, useQueries, useQueryClient } from "@tanstack/react-query";
import { usePatchPlan } from "@/features/billing";
import { useMasterResumeId } from "@/features/resumes";
import { createMatchBatcher } from "../lib/match-batcher";

const batchers = new WeakMap<QueryClient, ReturnType<typeof createMatchBatcher>>();

/** Cards and details observe the same master/job pair; network calls still batch at 20. */
export function useMasterJobScores(ids: readonly string[]) {
  const master = useMasterResumeId({ requirePrimary: true });
  const { canUsePaid } = usePatchPlan();
  const client = useQueryClient();
  let batch = batchers.get(client);
  if (!batch) {
    batch = createMatchBatcher((resumeId, jobIds) => postV1MatchBatch({ resumeId, jobIds }));
    batchers.set(client, batch);
  }
  const request = batch;
  const unique = [...new Set(ids)].filter((id) => /^[\da-f-]{36}$/i.test(id)).sort();
  const queries = useQueries({
    queries: unique.map((id) => ({
      queryKey: ["jobs-master-score", master.resumeId, master.updatedAt, id],
      queryFn: () => request(master.resumeId ?? "", id),
      enabled: canUsePaid && Boolean(master.resumeId),
      staleTime: 10 * 60_000,
      retry: false,
    })),
  });
  const scores: Record<string, number> = {};
  unique.forEach((id, index) => {
    const score = queries[index]?.data;
    if (canUsePaid && typeof score === "number") scores[id] = score;
  });
  return { scores, master };
}
