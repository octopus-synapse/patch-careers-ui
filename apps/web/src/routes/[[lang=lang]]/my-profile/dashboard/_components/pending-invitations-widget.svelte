<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createPutV1ConnectionsIdAccept,
  createPutV1ConnectionsIdReject,
  createGetV1UsersMeConnectionsPending,
  getV1UsersMeConnectionsPendingQueryKey,
} from 'api-client';
import { Button, Card, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';
import UserRow from '$lib/components/user/user-row.svelte';
import { locale } from '$lib/state/locale.svelte';

/**
 * Pending invitation items come from the canonical paginated endpoint.
 * Schema isn't yet emitted by orval (the swagger has `data: void`), so we
 * cast to a structural shape — this widget is dumb and just renders what
 * the backend ships under `items`.
 */
type PendingRequest = {
  id?: string;
  user?: { id?: string; name?: string | null; username?: string | null; photoURL?: string | null };
  requester?: {
    id?: string;
    name?: string | null;
    username?: string | null;
    photoURL?: string | null;
  };
};

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated ?? false);

const pendingQuery = createGetV1UsersMeConnectionsPending(
  { page: 1, limit: 3 },
  { query: { enabled: browser && authenticated } },
);

const pending = $derived.by(() => {
  const outer = $pendingQuery.data as
    | { items?: PendingRequest[]; total?: number }
    | undefined;
  return {
    data: outer?.items ?? [],
    total: outer?.total,
  };
});

const queryClient = useQueryClient();
const acceptMutation = createPutV1ConnectionsIdAccept({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: getV1UsersMeConnectionsPendingQueryKey(),
      });
    },
  },
});
const rejectMutation = createPutV1ConnectionsIdReject({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: getV1UsersMeConnectionsPendingQueryKey(),
      });
    },
  },
});

// Track which row is mid-flight so the spinner attaches to the right button
// instead of disabling the whole list (#29).
let pendingActionId = $state<string | null>(null);
let pendingActionKind = $state<'accept' | 'reject' | null>(null);

async function onAccept(id: string) {
  pendingActionId = id;
  pendingActionKind = 'accept';
  try {
    await $acceptMutation.mutateAsync({ id });
  } finally {
    pendingActionId = null;
    pendingActionKind = null;
  }
}

async function onReject(id: string) {
  pendingActionId = id;
  pendingActionKind = 'reject';
  try {
    await $rejectMutation.mutateAsync({ id });
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

	{#if $pendingQuery.isLoading}
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
				{@const u = request.user ?? request.requester ?? {}}
				{@const reqId = String(request.id ?? '')}
				<UserRow
					layout="stacked"
					user={{
						id: String(u.id ?? ''),
						name: u.name ?? null,
						username: u.username ?? null,
						photoURL: u.photoURL ?? null,
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
