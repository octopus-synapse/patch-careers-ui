<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createConnectionAcceptConnection,
  createConnectionGetPendingRequests,
  createConnectionRejectConnection,
  getConnectionGetConnectionsQueryKey,
  getConnectionGetPendingRequestsQueryKey,
} from 'api-client';
import { Button, Card, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';
import UserRow from '$lib/components/user/user-row.svelte';
import { locale } from '$lib/state/locale.svelte';

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

// Track which row is mid-flight so the spinner attaches to the right button
// instead of disabling the whole list (#29).
let pendingActionId = $state<string | null>(null);
let pendingActionKind = $state<'accept' | 'reject' | null>(null);

async function onAccept(id: string) {
  pendingActionId = id;
  pendingActionKind = 'accept';
  try {
    await acceptMutation.mutateAsync({ id });
  } finally {
    pendingActionId = null;
    pendingActionKind = null;
  }
}

async function onReject(id: string) {
  pendingActionId = id;
  pendingActionKind = 'reject';
  try {
    await rejectMutation.mutateAsync({ id });
  } finally {
    pendingActionId = null;
    pendingActionKind = null;
  }
}
</script>

<Card>
	{#snippet title()}
		<div class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-neutral-200">
				{t('dashboard.invitationsTitle')}
				{#if (pending.total ?? 0) > 0}
					<span
						class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-100 px-1.5 text-[11px] font-semibold tabular-nums text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
					>
						{pending.total}
					</span>
				{/if}
			</h2>
			{#if (pending.total ?? 0) > pending.data.length}
				<a
					href="/social/network/invitation-manager/received"
					class="text-xs font-medium text-cyan-600 hover:underline dark:text-cyan-300"
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
					layout="stacked"
					user={{
						id: String(user.id ?? ''),
						name: user.name,
						username: user.username,
						photoURL: user.photoURL
					}}
				>
					{#snippet actions()}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => onReject(reqId)}
							disabled={pendingActionId === reqId}
							aria-label={t('dashboard.invitationsIgnore')}
						>
							{t('dashboard.invitationsIgnore')}
						</Button>
						<Button
							variant="solid"
							intent="accent"
							size="sm"
							onclick={() => onAccept(reqId)}
							disabled={pendingActionId === reqId}
							aria-label={t('dashboard.invitationsAccept')}
						>
							{t('dashboard.invitationsAccept')}
						</Button>
					{/snippet}
				</UserRow>
			{/each}
			{#if (pending.total ?? 0) > pending.data.length}
				<p class="px-3 pt-2 text-xs text-gray-500 dark:text-neutral-500 sm:px-5">
					{t('dashboard.invitationsShowing', { shown: pending.data.length, total: pending.total ?? 0 })}
				</p>
			{/if}
		</div>
	{/if}
</Card>
