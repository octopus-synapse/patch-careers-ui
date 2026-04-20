<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createConnectionAcceptConnection,
  createConnectionGetPendingRequests,
  createConnectionRejectConnection,
  getConnectionGetConnectionsQueryKey,
  getConnectionGetPendingRequestsQueryKey,
} from 'api-client';
import { UserCheck } from 'lucide-svelte';
import { Button, Card, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/auth.svelte';
import UserRow from '$lib/components/user-row.svelte';
import { locale } from '$lib/locale.svelte';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

const pendingQuery = createConnectionGetPendingRequests(
  () => ({ page: 1, limit: 3 }),
  () => ({ query: { enabled: browser && authenticated } }),
);

const pending = $derived.by(() => {
  const outer = pendingQuery.data as Record<string, unknown> | undefined;
  const section = outer?.pendingRequests as Record<string, unknown> | undefined;
  return {
    data: (section?.data as Record<string, unknown>[] | undefined) ?? [],
    total: section?.total as number | undefined,
  };
});

const queryClient = useQueryClient();
const acceptMutation = createConnectionAcceptConnection(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getConnectionGetPendingRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getConnectionGetConnectionsQueryKey() });
    },
  },
}));
const rejectMutation = createConnectionRejectConnection(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getConnectionGetPendingRequestsQueryKey() });
    },
  },
}));
</script>

<Card>
	{#snippet title()}
		<div class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-neutral-200">
				<UserCheck size={16} />
				{t('dashboard.invitationsTitle')}
				{#if (pending.total ?? 0) > 0}
					<span class="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
						{pending.total}
					</span>
				{/if}
			</h2>
			{#if (pending.total ?? 0) > pending.data.length}
				<a
					href="/mynetwork/invitation-manager/received"
					class="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
				>
					{t('dashboard.invitationsSeeAll')}
				</a>
			{/if}
		</div>
	{/snippet}

	{#if pendingQuery.isLoading}
		<ul class="space-y-3">
			{#each Array(2) as _}
				<li class="flex items-center gap-3">
					<Skeleton shape="circle" width="2.5rem" height="2.5rem" />
					<div class="flex-1 space-y-1.5">
						<Skeleton shape="text" width="50%" />
						<Skeleton shape="text" width="30%" />
					</div>
				</li>
			{/each}
		</ul>
	{:else if pending.data.length === 0}
		<p class="text-xs text-gray-500 dark:text-neutral-500">
			{t('dashboard.invitationsEmpty')}
		</p>
	{:else}
		<div class="divide-y divide-gray-100 dark:divide-neutral-700/40">
			{#each pending.data as request}
				{@const user = (request.user ?? request.requester ?? request) as Record<string, string | null>}
				{@const reqId = String(request.id ?? '')}
				<UserRow
					user={{
						id: String(user.id ?? ''),
						name: user.name,
						username: user.username,
						photoURL: user.photoURL
					}}
				>
					{#snippet actions()}
						<Button
							variant="outline"
							size="sm"
							onclick={() => rejectMutation.mutate({ id: reqId })}
						>
							{t('dashboard.invitationsIgnore')}
						</Button>
						<Button
							variant="outline"
							intent="accent"
							size="sm"
							onclick={() => acceptMutation.mutate({ id: reqId })}
						>
							{t('dashboard.invitationsAccept')}
						</Button>
					{/snippet}
				</UserRow>
			{/each}
		</div>
	{/if}
</Card>
