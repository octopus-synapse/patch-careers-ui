import { getV1JobsExternalId } from "@patch-careers/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "@/providers/auth-provider";
import type { Opportunity, WorkspaceEntry } from "../lib/discovery";
import { EXTERNAL_JOBS_BASE, findExternalJob } from "./queries";

export function useJobOpportunity(
  id: string,
  entries: WorkspaceEntry[],
  workspaceLoading: boolean,
) {
  const client = useQueryClient();
  const { currentUser } = useAuthState();
  const stored = entries.find((entry) => entry.job.id === id)?.job;
  const cached = findExternalJob(client, id);
  const isExternalId = /^[\da-f-]{36}$/i.test(id) && stored?.source !== "imported";
  const query = useQuery<{ items: Opportunity[] }>({
    queryKey: [EXTERNAL_JOBS_BASE, "detail", currentUser?.userId, id],
    queryFn: async ({ signal }): Promise<{ items: Opportunity[] }> => ({
      items: [await getV1JobsExternalId(id, { signal })],
    }),
    enabled: isExternalId,
    ...(cached ? { initialData: { items: [cached] } } : {}),
    staleTime: 60_000,
    retry: false,
  });
  return {
    job: (query.data?.items[0] ?? stored ?? null) as Opportunity | null,
    isLoading: query.isLoading || (!query.data && workspaceLoading),
    isError: query.isError && !stored,
    refetch: query.refetch,
  };
}
