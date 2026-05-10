<script lang="ts">
import { Clock, Eye, UserCheck, Users } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Button, EmptyState, Skeleton, StatGrid, type StatItem, Tabs } from 'ui';
import { browser } from '$app/environment';
import {
  createGetV1UsersMeConnections,
  createGetV1UsersMeNetworkSummary,
  createGetV1UsersUserIdFollowers,
  createGetV1UsersUserIdFollowing,
  putV1ConnectionsIdAccept,
  putV1ConnectionsIdReject,
  deleteV1ConnectionsId,
  getV1UsersMeConnections,
  getV1UsersMeConnectionsQueryKey,
  type GetV1UsersMeNetworkSummary200,
} from 'api-client';
import { useQueryClient } from '@tanstack/svelte-query';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';
import { undoableAction } from '$lib/utils/undoable-action';
import { track } from '$lib/utils/analytics/track';
import SuggestionsCarousel from './_components/suggestions-carousel.svelte';
import QuickMessagePopover from './_components/quick-message-popover.svelte';
import UserRow from '$lib/components/user/user-row.svelte';
import { InfiniteScrollTrigger } from 'ui';

/**
 * "My Network" hub — frontend BURRO. Reads
 * `GET /api/v1/social/connections/users/me/network-summary` (canonical
 * dashboard envelope `{stats, connections, suggestions, pendingRequests}`)
 * and the per-side follow lists. The pending/connection mutations all
 * route through `undoableAction` so a misclick can be reversed within 5s.
 */
type ConnectionRecord = GetV1UsersMeNetworkSummary200['connections']['items'][number];
type PendingRecord = GetV1UsersMeNetworkSummary200['pendingRequests']['items'][number];

function userOf(r: ConnectionRecord | PendingRecord) {
  return r.user ?? r.requester ?? r.target;
}

const t = $derived(locale.t);

const auth = useAuth();
const currentUserId = $derived(String(auth.userId ?? ''));
const authenticated = $derived(auth.isAuthenticated);

const summaryQuery = createGetV1UsersMeNetworkSummary(
  { query: { enabled: browser && !!authenticated } },
);

const followersQuery = createGetV1UsersUserIdFollowers(
  currentUserId,
  { page: 1, limit: 10 },
  { query: { enabled: browser && !!currentUserId } },
);
const followingQuery = createGetV1UsersUserIdFollowing(
  currentUserId,
  { page: 1, limit: 10 },
  { query: { enabled: browser && !!currentUserId } },
);

const summary = $derived($summaryQuery.data);
const stats = $derived(summary?.stats);
const pendingList = $derived(summary?.pendingRequests.items);
const suggestionsList = $derived(summary?.suggestions.items);
const connectionsFirstPage = $derived(summary?.connections.items);
const connectionsTotal = $derived(summary?.connections.total ?? 0);
const connectionsTotalPages = $derived(summary?.connections.totalPages ?? 0);

const followersList = $derived($followersQuery.data?.items);
const followingList = $derived($followingQuery.data?.items);

// Infinite scroll for connections — extra pages loaded after the first page
// arrives from the network summary.
let connectionsExtra = $state<ConnectionRecord[]>([]);
let connectionsPage = $state(1);
let connectionsLoading = $state(false);

// Rows the user has optimistically removed. Kept so undo can restore them
// without waiting for another refetch.
let hiddenConnectionIds = $state<Set<string>>(new Set());
let hiddenPendingIds = $state<Set<string>>(new Set());

const connectionsList = $derived(
  (connectionsFirstPage ? [...connectionsFirstPage, ...connectionsExtra] : connectionsExtra).filter(
    (c) => !hiddenConnectionIds.has(c.id),
  ),
);
const visiblePending = $derived(
  pendingList ? pendingList.filter((p) => !hiddenPendingIds.has(p.id)) : [],
);

async function loadMoreConnections() {
  if (connectionsLoading) return;
  connectionsLoading = true;
  try {
    const next = connectionsPage + 1;
    const res = await getV1UsersMeConnections({
      page: next,
      limit: 10,
    });
    connectionsExtra = [...connectionsExtra, ...res.items];
    connectionsPage = next;
  } finally {
    connectionsLoading = false;
  }
}

const queryClient = useQueryClient();

function invalidateNetwork() {
  // The summary endpoint is the single source of truth for the dashboard;
  // we wildcard-invalidate every key whose first segment touches network /
  // connections so children (followers, suggestions) refresh too.
  queryClient.invalidateQueries({ predicate: () => true, refetchType: 'all' });
}

function handleAccept(row: PendingRecord) {
  undoableAction({
    apply: () => (hiddenPendingIds = new Set([...hiddenPendingIds, row.id])),
    revert: () => {
      const next = new Set(hiddenPendingIds);
      next.delete(row.id);
      hiddenPendingIds = next;
    },
    commit: () => putV1ConnectionsIdAccept(row.id),
    onCommitted: () => {
      invalidateNetwork();
      track('connection_accepted', { requestId: row.id, source: 'mynetwork_main' });
    },
    message: t('network.connectionAcceptedUndo'),
    undoLabel: t('network.undo'),
    errorMessage: t('network.undoableFailed'),
  });
}

function handleReject(row: PendingRecord) {
  undoableAction({
    apply: () => (hiddenPendingIds = new Set([...hiddenPendingIds, row.id])),
    revert: () => {
      const next = new Set(hiddenPendingIds);
      next.delete(row.id);
      hiddenPendingIds = next;
    },
    commit: () => putV1ConnectionsIdReject(row.id),
    onCommitted: () => {
      invalidateNetwork();
      track('connection_rejected', { requestId: row.id, source: 'mynetwork_main' });
    },
    message: t('network.connectionRejectedUndo'),
    undoLabel: t('network.undo'),
    errorMessage: t('network.undoableFailed'),
  });
}

function handleRemove(row: ConnectionRecord) {
  undoableAction({
    apply: () => (hiddenConnectionIds = new Set([...hiddenConnectionIds, row.id])),
    revert: () => {
      const next = new Set(hiddenConnectionIds);
      next.delete(row.id);
      hiddenConnectionIds = next;
    },
    commit: () => deleteV1ConnectionsId(row.id),
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

type StatIcon = Component<{ size: number; class?: string }>;

const statItems = $derived<StatItem[]>([
  {
    label: t('network.connections'),
    value: stats?.connections ?? 0,
    icon: Users as unknown as StatIcon,
    href: '/social/network/connections',
  },
  {
    label: t('network.followers'),
    value: stats?.followers ?? 0,
    icon: Eye as unknown as StatIcon,
    href: '/social/network/followers',
  },
  {
    label: t('network.following'),
    value: stats?.following ?? 0,
    icon: UserCheck as unknown as StatIcon,
    href: '/social/network/following',
  },
  {
    label: t('network.invitations'),
    value: stats?.pendingInvitations ?? 0,
    icon: Clock as unknown as StatIcon,
    href: '/social/network/invitation-manager/received',
    highlight: (stats?.pendingInvitations ?? 0) > 0,
  },
]);
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
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{stats?.connections ?? 0}</span>
					</a>
					<a href="/social/network/followers" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span>{t('network.followers')}</span>
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{stats?.followers ?? 0}</span>
					</a>
					<a href="/social/network/following" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span>{t('network.following')}</span>
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{stats?.following ?? 0}</span>
					</a>
					<a href="/social/network/invitation-manager/received" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span>{t('network.invitations')}</span>
						{#if stats && stats.pendingInvitations > 0}
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
			<StatGrid title={t('network.statsTitle')} items={statItems} columns={4} />

			<!-- Invitations (always visible, preview of 2) -->
			<section id="invitations" class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
				<div class="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-neutral-800">
					<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
						{t('network.invitations')} ({stats?.pendingInvitations ?? 0})
					</h2>
					{#if visiblePending.length > 0}
						<a href="/social/network/invitation-manager/received" class="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-300">
							{t('network.showAll')}
						</a>
					{/if}
				</div>
				{#if $summaryQuery.isLoading}
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
							{@const u = userOf(request)}
							{#if u}
								<UserRow user={u}>
									{#snippet actions()}
										<Button variant="outline" size="sm" textCase="normal" onclick={() => handleReject(request)}>{t('network.ignore')}</Button>
										<Button variant="outline" intent="accent" size="sm" textCase="normal" onclick={() => handleAccept(request)}>{t('network.accept')}</Button>
									{/snippet}
								</UserRow>
							{/if}
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
			{#if $summaryQuery.isLoading}
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
			{:else if suggestionsList && suggestionsList.length > 0}
				<div id="suggestions">
					<SuggestionsCarousel
						suggestions={suggestionsList.slice(0, 12)}
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
				{#if $summaryQuery.isLoading}
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
							{@const u = userOf(connection)}
							{@const displayName = u?.name ?? u?.username ?? '?'}
							{#if u}
								<UserRow user={u}>
									{#snippet actions()}
										<QuickMessagePopover recipientId={u.id} recipientName={displayName} />
										<Button variant="ghost" intent="danger" size="xs" textCase="normal" onclick={() => handleRemove(connection)}>
											{t('network.remove')}
										</Button>
									{/snippet}
								</UserRow>
							{/if}
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
							{ value: 'followers', label: t('network.followers'), count: stats?.followers ?? 0 },
							{ value: 'following', label: t('network.following'), count: stats?.following ?? 0 },
						]}
						selected={followersTab}
						onchange={(v) => (followersTab = v as 'followers' | 'following')}
					/>
				</div>
				{#if followersTab === 'followers'}
					{#if $followersQuery.isLoading}
						<div class="divide-y divide-gray-200 dark:divide-neutral-800">
							{#each Array(3) as _}
								<div class="flex items-center gap-3 px-5 py-3">
									<Skeleton shape="avatar" width="2rem" height="2rem" />
									<Skeleton shape="text" width="40%" />
								</div>
							{/each}
						</div>
					{:else if !followersList || followersList.length === 0}
						<EmptyState message={t('network.noFollowers')} />
					{:else}
						<div class="divide-y divide-gray-200 dark:divide-neutral-800">
							{#each followersList as row (row.id)}
								{#if row.follower}
									<UserRow user={row.follower} />
								{/if}
							{/each}
						</div>
					{/if}
				{:else if $followingQuery.isLoading}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each Array(3) as _}
							<div class="flex items-center gap-3 px-5 py-3">
								<Skeleton shape="avatar" width="2rem" height="2rem" />
								<Skeleton shape="text" width="40%" />
							</div>
						{/each}
					</div>
				{:else if !followingList || followingList.length === 0}
					<EmptyState message={t('network.noFollowing')} />
				{:else}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each followingList as row (row.id)}
							{#if row.following}
								<UserRow user={row.following} />
							{/if}
						{/each}
					</div>
				{/if}
			</section>
		</main>
	</div>
</div>
