import {
  type GetV1MeUiState200,
  getV1MeUiState,
  patchV1MeUiStateKey,
} from "@patch-careers/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { useAuthState } from "@/providers/auth-provider";
import {
  emptyEntry,
  type Opportunity,
  readWorkspace,
  type WorkspaceEntry,
  workspaceKey,
} from "../lib/discovery";

const DRAFT_KEY = "jobs.v2.composer";
const draftSchema = z.object({
  input: z.string().max(12000),
  context: z.string().max(3000),
  jobId: z.string().nullable(),
  step: z.enum(["input", "choice", "letter"]),
});
export type ComposerDraft = z.infer<typeof draftSchema>;

/** Per-opportunity UI state uses the existing authenticated, server-persisted UI-state API.
 * Each key is independent: updating one application cannot overwrite another one.
 * Actual bookmarks, submitted applications and resume versions retain their own APIs.
 */
export function useJobsWorkspace() {
  const { currentUser } = useAuthState();
  const client = useQueryClient();
  const key = ["jobs-workspace", currentUser?.userId] as const;
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(currentUser?.userId),
    queryFn: ({ signal }) => getV1MeUiState({ signal }),
    staleTime: 30_000,
  });
  const mutation = useMutation({
    scope: { id: `jobs-workspace-${currentUser?.userId}` },
    onMutate: async ({ job, update }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<GetV1MeUiState200>(key);
      if (previous) {
        const entry = readWorkspace(previous.state ?? {}).find(
          (item) => item.job.externalId === job.externalId,
        );
        const next = update(entry ?? emptyEntry(job));
        const entryKey = workspaceKey(entry?.job.id ?? job.id);
        client.setQueryData<GetV1MeUiState200>(key, {
          state: { ...previous.state, [entryKey]: next },
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    mutationFn: async ({
      job,
      update,
    }: {
      job: Opportunity;
      update: (entry: WorkspaceEntry) => WorkspaceEntry;
    }) => {
      const data =
        client.getQueryData<GetV1MeUiState200>(key) ??
        (await client.fetchQuery({ queryKey: key, queryFn: () => getV1MeUiState() }));
      const entry = readWorkspace(data?.state ?? {}).find(
        (item) => item.job.externalId === job.externalId,
      );
      const next = update(entry ?? emptyEntry(job));
      const entryKey = workspaceKey(entry?.job.id ?? job.id);
      await patchV1MeUiStateKey(entryKey, { value: next });
      client.setQueryData<GetV1MeUiState200>(key, (old) => ({
        state: { ...old?.state, [entryKey]: next },
      }));
      return next;
    },
  });
  const draftMutation = useMutation({
    scope: { id: `jobs-draft-${currentUser?.userId}` },
    mutationFn: async (draft: ComposerDraft) => {
      await patchV1MeUiStateKey(DRAFT_KEY, { value: draft });
      client.setQueryData<GetV1MeUiState200>(key, (old) => ({
        state: { ...old?.state, [DRAFT_KEY]: draft },
      }));
    },
  });
  const entries = useMemo(() => readWorkspace(query.data?.state ?? {}), [query.data]);
  const draft = useMemo(() => {
    const parsed = draftSchema.safeParse(query.data?.state[DRAFT_KEY]);
    return parsed.success ? parsed.data : null;
  }, [query.data]);
  const mutate = mutation.mutateAsync;
  const update = useCallback(
    (job: Opportunity, update: (entry: WorkspaceEntry) => WorkspaceEntry) =>
      mutate({ job, update }),
    [mutate],
  );
  return {
    entries,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    pending: mutation.isPending,
    draft,
    saveDraft: draftMutation.mutateAsync,
    update,
  };
}
