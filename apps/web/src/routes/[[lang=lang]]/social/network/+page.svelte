<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  connectionAcceptConnection,
  connectionGetConnections,
  connectionRejectConnection,
  connectionRemoveConnection,
  createConnectionGetNetworkSummary,
  createFollowGetFollowers,
  createFollowGetFollowing,
  type FollowListDataDtoFollowersDataItem,
  type FollowingListDataDtoFollowingDataItem,
  getConnectionGetConnectionsQueryKey,
  getConnectionGetNetworkSummaryQueryKey,
  getConnectionGetPendingRequestsQueryKey,
  type NetworkSummaryDataDtoSuggestionsDataItem,
} from 'api-client';
import { UserCheck } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Button, EmptyState, Skeleton, Tabs } from 'ui';
import { browser } from '$app/environment';
import { track } from '$lib/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import SuggestionsCarousel from '$lib/components/mynetwork/suggestions-carousel.svelte';
import NetworkStatsCard from '$lib/components/mynetwork/network-stats-card.svelte';
import QuickMessagePopover from '$lib/components/mynetwork/quick-message-popover.svelte';
import UserRow from '$lib/components/user-row.svelte';
import { locale } from '$lib/state/locale.svelte';
import { undoableAction } from '$lib/query/undoable-action';
import InfiniteScrollTrigger from '$lib/components/data/infinite-scroll-trigger.svelte';

type UserInfo = {
  id: string;
  name: string | null;
  username: string | null;
  photoURL: string | null;
};

type PendingRow = { id: string; user: UserInfo };
type ConnectionRow = { id: string; user: UserInfo };
type FollowerRow = UserInfo;
type FollowingRow = UserInfo;

function extractUser(raw: Record<string, unknown> | undefined | null): UserInfo {
  const r = raw ?? {};
  return {
    id: String((r.id as string | undefined) ?? ''),
    name: (r.name as string | null | undefined) ?? null,
    username: (r.username as string | null | undefined) ?? null,
    photoURL: (r.photoURL as string | null | undefined) ?? null,
  };
}

function toPending(raw: unknown): PendingRow {
  const r = (raw as Record<string, unknown>) ?? {};
  const user = extractUser(
    (r.user ?? r.requester ?? r) as Record<string, unknown> | undefined,
  );
  return { id: String((r.id as string | undefined) ?? ''), user };
}

function toConnection(raw: unknown): ConnectionRow {
  const r = (raw as Record<string, unknown>) ?? {};
  const user = extractUser((r.user ?? r) as Record<string, unknown> | undefined);
  return { id: String((r.id as string | undefined) ?? ''), user };
}

function toFollower(row: FollowListDataDtoFollowersDataItem): FollowerRow {
  return {
    id: row.follower?.id ?? '',
    name: row.follower?.name ?? null,
    username: row.follower?.username ?? null,
    photoURL: row.follower?.photoURL ?? null,
  };
}

function toFollowing(row: FollowingListDataDtoFollowingDataItem): FollowingRow {
  return {
    id: row.following?.id ?? '',
    name: row.following?.name ?? null,
    username: row.following?.username ?? null,
    photoURL: row.following?.photoURL ?? null,
  };
}

const t = $derived(locale.t);

const auth = useAuth();
const currentUserId = $derived(String(auth.data?.user?.id ?? ''));
const authenticated = $derived(auth.data?.authenticated);

const summaryQuery = createConnectionGetNetworkSummary(
  () => ({ query: { enabled: browser && authenticated } }),
);
const followersQuery = createFollowGetFollowers(
  () => currentUserId,
  () => ({ page: 1, limit: 10 }),
  () => ({ query: { enabled: browser && !!currentUserId } }),
);
const followingQuery = createFollowGetFollowing(
  () => currentUserId,
  () => ({ page: 1, limit: 10 }),
  () => ({ query: { enabled: browser && !!currentUserId } }),
);

const stats = $derived(
  summaryQuery.data?.stats ?? { connections: 0, followers: 0, following: 0, pendingInvitations: 0 },
);
const pendingList = $derived((summaryQuery.data?.pendingRequests.data ?? []).map(toPending));
const suggestionsList = $derived<NetworkSummaryDataDtoSuggestionsDataItem[]>(
  summaryQuery.data?.suggestions.data ?? [],
);
const connectionsFirstPage = $derived(
  (summaryQuery.data?.connections.data ?? []).map(toConnection),
);
const connectionsTotal = $derived(summaryQuery.data?.connections.total ?? 0);
const connectionsTotalPages = $derived(summaryQuery.data?.connections.totalPages ?? 0);

const followersSection = $derived(
  (followersQuery.data as { followers?: { data?: FollowListDataDtoFollowersDataItem[]; total?: number } } | undefined)
    ?.followers,
);
const followingSection = $derived(
  (followingQuery.data as { following?: { data?: FollowingListDataDtoFollowingDataItem[]; total?: number } } | undefined)
    ?.following,
);
const followersList = $derived((followersSection?.data ?? []).map(toFollower));
const followingList = $derived((followingSection?.data ?? []).map(toFollowing));

// Infinite scroll for connections — extra pages loaded after the first page
// arrives from the network summary.
let connectionsExtra = $state<ConnectionRow[]>([]);
let connectionsPage = $state(1);
let connectionsLoading = $state(false);

// Rows the user has optimistically removed. Kept so undo can restore them
// without waiting for another refetch.
let hiddenConnectionIds = $state<Set<string>>(new Set());
let hiddenPendingIds = $state<Set<string>>(new Set());

const connectionsList = $derived(
  [...connectionsFirstPage, ...connectionsExtra].filter((c) => !hiddenConnectionIds.has(c.id)),
);
const visiblePending = $derived(pendingList.filter((p) => !hiddenPendingIds.has(p.id)));

async function loadMoreConnections() {
  if (connectionsLoading) return;
  connectionsLoading = true;
  try {
    const next = connectionsPage + 1;
    const res = (await connectionGetConnections({ page: next, limit: 10 })) as unknown as
      | { connections?: { data?: unknown[] } }
      | undefined;
    const items = res?.connections?.data ?? [];
    connectionsExtra = [...connectionsExtra, ...items.map(toConnection)];
    connectionsPage = next;
  } finally {
    connectionsLoading = false;
  }
}

// Mutations. All three use `undoableAction`: the UI reflects the change
// immediately, a toast with "Undo" holds the server write for 5s, and a
// mistimed click can be reversed without a round trip.
const queryClient = useQueryClient();

function invalidateNetwork() {
  queryClient.invalidateQueries({
    queryKey: getConnectionGetNetworkSummaryQueryKey(),
    refetchType: 'all',
  });
  queryClient.invalidateQueries({
    queryKey: getConnectionGetPendingRequestsQueryKey(),
    refetchType: 'all',
  });
  queryClient.invalidateQueries({
    queryKey: getConnectionGetConnectionsQueryKey(),
    refetchType: 'all',
  });
}

function handleAccept(row: PendingRow) {
  undoableAction({
    apply: () => (hiddenPendingIds = new Set([...hiddenPendingIds, row.id])),
    revert: () => {
      const next = new Set(hiddenPendingIds);
      next.delete(row.id);
      hiddenPendingIds = next;
    },
    commit: () => connectionAcceptConnection(row.id),
    onCommitted: () => {
      invalidateNetwork();
      track('connection_accepted', { requestId: row.id, source: 'mynetwork_main' });
    },
    message: t('network.connectionAcceptedUndo'),
    undoLabel: t('network.undo'),
    errorMessage: t('network.undoableFailed'),
  });
}

function handleReject(row: PendingRow) {
  undoableAction({
    apply: () => (hiddenPendingIds = new Set([...hiddenPendingIds, row.id])),
    revert: () => {
      const next = new Set(hiddenPendingIds);
      next.delete(row.id);
      hiddenPendingIds = next;
    },
    commit: () => connectionRejectConnection(row.id),
    onCommitted: () => {
      invalidateNetwork();
      track('connection_rejected', { requestId: row.id, source: 'mynetwork_main' });
    },
    message: t('network.connectionRejectedUndo'),
    undoLabel: t('network.undo'),
    errorMessage: t('network.undoableFailed'),
  });
}

function handleRemove(row: ConnectionRow) {
  undoableAction({
    apply: () => (hiddenConnectionIds = new Set([...hiddenConnectionIds, row.id])),
    revert: () => {
      const next = new Set(hiddenConnectionIds);
      next.delete(row.id);
      hiddenConnectionIds = next;
    },
    commit: () => connectionRemoveConnection(row.id),
    onCommitted: () => {
      invalidateNetwork();
      track('connection_removed', { connectionId: row.id, source: 'mynetwork_main' });
    },
    message: t('network.connectionRemovedUndo'),
    undoLabel: t('network.undo'),
    errorMessage: t('network.undoableFailed'),
  });
}

let followersTab = $state<'followers' | 'following'>('followers');
</script>

<svelte:head>
	<title>{t('network.pageTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto flex max-w-5xl gap-4 px-3 sm:gap-6 sm:px-6">
		<!-- Sidebar -->
		<aside class="hidden w-48 flex-shrink-0 md:block lg:w-56">
			<div class="sticky top-20 rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/30">
				<div class="px-4 pt-4 pb-2">
					<h2 class="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
						{t('network.manageNetwork')}
					</h2>
				</div>
				<nav class="flex flex-col py-1">
					<a href="/social/network/connections" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span>{t('network.connections')}</span>
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{stats.connections}</span>
					</a>
					<a href="/social/network/followers" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span>{t('network.followers')}</span>
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{stats.followers}</span>
					</a>
					<a href="/social/network/following" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span>{t('network.following')}</span>
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{stats.following}</span>
					</a>
					<a href="/social/network/invitation-manager/received" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span>{t('network.invitations')}</span>
						{#if stats.pendingInvitations > 0}
							<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{stats.pendingInvitations}</span>
						{:else}
							<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">0</span>
						{/if}
					</a>
				</nav>
			</div>
		</aside>

		<!-- Main -->
		<main class="flex-1 min-w-0 flex flex-col gap-6">
			<!-- Stats at a glance -->
			<NetworkStatsCard
				connections={stats.connections}
				followers={stats.followers}
				following={stats.following}
				pending={stats.pendingInvitations}
			/>

			<!-- Invitations (always visible, preview of 2) -->
			<section id="invitations" class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
				<div class="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-neutral-800">
					<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
						{t('network.invitations')} ({stats.pendingInvitations})
					</h2>
					{#if visiblePending.length > 0}
						<a href="/social/network/invitation-manager/received" class="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-300">
							{t('network.showAll')}
						</a>
					{/if}
				</div>
				{#if summaryQuery.isLoading}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each Array(2) as _}
							<div class="flex items-center gap-3 px-5 py-4">
								<Skeleton shape="avatar" width="2.5rem" height="2.5rem" />
								<div class="flex-1 space-y-2">
									<Skeleton shape="text" width="35%" />
									<Skeleton shape="text" width="20%" />
								</div>
								<Skeleton shape="rect" width="4.5rem" height="1.75rem" />
							</div>
						{/each}
					</div>
				{:else if visiblePending.length > 0}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each visiblePending.slice(0, 2) as request (request.id)}
							<UserRow user={request.user}>
								{#snippet actions()}
									<Button variant="outline" size="sm" onclick={() => handleReject(request)}>{t('network.ignore')}</Button>
									<Button variant="outline" intent="accent" size="sm" onclick={() => handleAccept(request)}>{t('network.accept')}</Button>
								{/snippet}
							</UserRow>
						{/each}
					</div>
				{:else}
					<EmptyState
						message={t('network.invitationsEmptyTitle')}
						icon={UserCheck as unknown as Component<{ size: number; class?: string }>}
					/>
				{/if}
			</section>

			<!-- Suggestions carousel -->
			{#if summaryQuery.isLoading}
				<section class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
					<div class="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
						<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{t('network.suggestions')}</h2>
					</div>
					<div class="grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:px-5 sm:py-4 sm:gap-4">
						{#each Array(4) as _}
							<div class="flex flex-col items-center gap-2 rounded-xl border p-4 border-gray-200 dark:border-neutral-800">
								<Skeleton shape="avatar" width="3.5rem" height="3.5rem" />
								<Skeleton shape="text" width="70%" />
								<Skeleton shape="text" width="50%" />
								<Skeleton shape="rect" width="100%" height="2rem" />
							</div>
						{/each}
					</div>
				</section>
			{:else if suggestionsList.length > 0}
				<div id="suggestions">
					<SuggestionsCarousel
						suggestions={suggestionsList.slice(0, 12).map((s) => ({
							id: s.id,
							name: s.name,
							username: s.username,
							photoURL: s.photoURL,
							reason: s.reason,
							mutualCount: s.mutualCount,
							commonSkills: s.commonSkills,
						}))}
						seeAllHref="/social/network/suggestions"
						source="mynetwork_carousel"
					/>
				</div>
			{/if}

			<!-- Connections -->
			<section id="connections" class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
				<div class="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
					<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
						{t('network.connections')} ({connectionsTotal})
					</h2>
				</div>
				{#if summaryQuery.isLoading}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each Array(3) as _}
							<div class="flex items-center gap-3 px-5 py-3.5">
								<Skeleton shape="avatar" width="2.5rem" height="2.5rem" />
								<div class="flex-1 space-y-2">
									<Skeleton shape="text" width="40%" />
									<Skeleton shape="text" width="25%" />
								</div>
								<Skeleton shape="rect" width="5rem" height="1.75rem" />
							</div>
						{/each}
					</div>
				{:else if connectionsList.length === 0}
					<EmptyState message={t('network.noConnections')} />
				{:else}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each connectionsList as connection (connection.id)}
							{@const displayName = connection.user.name ?? connection.user.username ?? '?'}
							<UserRow user={connection.user}>
								{#snippet actions()}
									{#if connection.user.id}
										<QuickMessagePopover recipientId={connection.user.id} recipientName={displayName} />
									{/if}
									<Button variant="ghost" intent="danger" size="xs" onclick={() => handleRemove(connection)}>
										{t('network.remove')}
									</Button>
								{/snippet}
							</UserRow>
						{/each}
						<InfiniteScrollTrigger onLoadMore={loadMoreConnections} hasMore={connectionsPage < connectionsTotalPages} isLoading={connectionsLoading} />
					</div>
				{/if}
			</section>

			<!-- Followers / Following tabs -->
			<section id="followers" class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
				<div class="px-4 pt-2 sm:px-5">
					<Tabs
						tabs={[
							{ value: 'followers', label: t('network.followers'), count: stats.followers },
							{ value: 'following', label: t('network.following'), count: stats.following },
						]}
						selected={followersTab}
						onchange={(v) => (followersTab = v as 'followers' | 'following')}
					/>
				</div>
				{#if followersTab === 'followers'}
					{#if followersQuery.isLoading}
						<div class="divide-y divide-gray-200 dark:divide-neutral-800">
							{#each Array(3) as _}
								<div class="flex items-center gap-3 px-5 py-3">
									<Skeleton shape="avatar" width="2rem" height="2rem" />
									<Skeleton shape="text" width="40%" />
								</div>
							{/each}
						</div>
					{:else if followersList.length === 0}
						<EmptyState message={t('network.noFollowers')} />
					{:else}
						<div class="divide-y divide-gray-200 dark:divide-neutral-800">
							{#each followersList as user (user.id)}
								<UserRow {user} />
							{/each}
						</div>
					{/if}
				{:else if followingQuery.isLoading}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each Array(3) as _}
							<div class="flex items-center gap-3 px-5 py-3">
								<Skeleton shape="avatar" width="2rem" height="2rem" />
								<Skeleton shape="text" width="40%" />
							</div>
						{/each}
					</div>
				{:else if followingList.length === 0}
					<EmptyState message={t('network.noFollowing')} />
				{:else}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each followingList as user (user.id)}
							<UserRow {user} />
						{/each}
					</div>
				{/if}
			</section>
		</main>
	</div>
</div>
