import type { CreateMutationOptions, QueryClient, QueryKey } from '@tanstack/svelte-query';
import { toastState } from 'ui';

export type OptimisticContext<TQueryData> = { previous: TQueryData | undefined };

type Params<TVars, TQueryData> = {
  queryClient: QueryClient;
  queryKey: QueryKey;
  updater: (old: TQueryData | undefined, vars: TVars) => TQueryData | undefined;
  errorMessage?: string;
  invalidateOnSettled?: boolean;
};

/**
 * Builds the `mutation` option block for an Orval-generated mutation hook so
 * that the affected query cache updates before the server responds and rolls
 * back automatically on failure. Shows a danger toast when the server rejects.
 *
 * Usage:
 * ```ts
 * const qc = useQueryClient();
 * const like = createEngagementLike(() => ({
 *   mutation: optimisticMutation({
 *     queryClient: qc,
 *     queryKey: getFeedGetTimelineQueryKey(),
 *     updater: (old, { id }) => bumpLikeInTimeline(old, id),
 *   }),
 * }));
 * ```
 */
export function optimisticMutation<TData, TError, TVars, TQueryData>({
  queryClient,
  queryKey,
  updater,
  errorMessage,
  invalidateOnSettled = true,
}: Params<TVars, TQueryData>): CreateMutationOptions<
  TData,
  TError,
  TVars,
  OptimisticContext<TQueryData>
> {
  return {
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TQueryData>(queryKey);
      queryClient.setQueryData<TQueryData>(queryKey, (old) => updater(old, vars));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context && 'previous' in context) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toastState.show(errorMessage ?? 'Não foi possível salvar', 'danger');
    },
    onSettled: () => {
      if (invalidateOnSettled) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  };
}
