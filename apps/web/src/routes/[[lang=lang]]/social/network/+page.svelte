<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  connectionGetConnections,
  createConnectionAcceptConnection,
  createConnectionGetConnectionSuggestions,
  createConnectionGetConnections,
  createConnectionGetPendingRequests,
  createConnectionRejectConnection,
  createConnectionRemoveConnection,
  createFollowGetFollowers,
  createFollowGetFollowing,
  getConnectionGetConnectionsQueryKey,
  getConnectionGetPendingRequestsQueryKey,
} from 'api-client';
import { Eye, MessageCircle, UserCheck, Users } from 'lucide-svelte';
import { Button, ConfirmModal } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';
import { chatState } from '$lib/state/chat-state.svelte';
import SuggestionsCarousel from '$lib/components/mynetwork/suggestions-carousel.svelte';
import UserRow from '$lib/components/user-row.svelte';
import { locale } from '$lib/state/locale.svelte';
import InfiniteScrollTrigger from '$lib/components/data/infinite-scroll-trigger.svelte';

const t = $derived(locale.t);

// Auth — after customFetch unwrap, data is the DTO directly
const auth = useAuth();
const currentUserId = $derived(String(auth.data?.user?.id ?? ''));
const authenticated = $derived(auth.data?.authenticated);

// Queries
const pendingQuery = createConnectionGetPendingRequests(
  () => ({ page: 1, limit: 10 }),
  () => ({ query: { enabled: browser && authenticated } }),
);
const connectionsQuery = createConnectionGetConnections(
  () => ({ page: 1, limit: 10 }),
  () => ({ query: { enabled: browser && authenticated } }),
);
const suggestionsQuery = createConnectionGetConnectionSuggestions(
  () => ({ page: 1, limit: 20 }),
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

function paged(queryData: unknown, key: string) {
  const outer = queryData as Record<string, unknown> | undefined;
  const section = outer?.[key] as Record<string, unknown> | undefined;
  return {
    data: section?.data as Record<string, unknown>[],
    total: section?.total as number | undefined,
    totalPages: section?.totalPages as number | undefined,
  };
}

const pending = $derived(paged(pendingQuery.data, 'pendingRequests'));
const connections = $derived(paged(connectionsQuery.data, 'connections'));
const suggestions = $derived(paged(suggestionsQuery.data, 'suggestions'));
const followers = $derived(paged(followersQuery.data, 'followers'));
const following = $derived(paged(followingQuery.data, 'following'));

// Infinite scroll (connections only — suggestions use carousel widget + dedicated page)
let connectionsExtra = $state<Record<string, unknown>[]>([]);
let connectionsPage = $state(1);
let connectionsLoading = $state(false);

const connectionsList = $derived(
  connections.data ? [...connections.data, ...connectionsExtra] : connectionsExtra,
);
const suggestionsList = $derived(suggestions.data ?? []);

async function loadMoreConnections() {
  if (connectionsLoading) return;
  connectionsLoading = true;
  try {
    const next = connectionsPage + 1;
    const res = (await connectionGetConnections({ page: next, limit: 10 })) as unknown as
      | Record<string, unknown>
      | undefined;
    const connectionsData = res?.connections as Record<string, unknown> | undefined;
    const items = connectionsData?.data as Record<string, unknown>[] | undefined;
    if (items) connectionsExtra = [...connectionsExtra, ...items];
    connectionsPage = next;
  } finally {
    connectionsLoading = false;
  }
}

// Mutations
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
const removeMutation = createConnectionRemoveConnection(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getConnectionGetConnectionsQueryKey() });
      removeTarget = null;
    },
  },
}));
let removeTarget = $state<{ id: string; name: string } | null>(null);
</script>

<svelte:head>
	<title>{t('network.pageTitle')}</title>
</svelte:head>

<ConfirmModal
	open={removeTarget !== null}
	onClose={() => removeTarget = null}
	onConfirm={() => { if (removeTarget) removeMutation.mutate({ id: removeTarget.id }); }}
	title={t('network.removeConfirmTitle')}
	message={t('network.removeConfirmMessage').replace('{name}', removeTarget?.name ?? '')}
/>

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
						<span class="flex items-center gap-2.5">
							<Users size={16} class="text-gray-500 dark:text-neutral-500" />
							{t('network.connections')}
						</span>
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{connections.total}</span>
					</a>
					<a href="/social/network/followers" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span class="flex items-center gap-2.5">
							<Eye size={16} class="text-gray-500 dark:text-neutral-500" />
							{t('network.followers')}
						</span>
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{followers.total ?? 0}</span>
					</a>
					<a href="/social/network/following" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span class="flex items-center gap-2.5">
							<Eye size={16} class="text-gray-500 dark:text-neutral-500" />
							{t('network.following')}
						</span>
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{following.total ?? 0}</span>
					</a>
					<a href="#invitations" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50">
						<span class="flex items-center gap-2.5">
							<UserCheck size={16} class="text-gray-500 dark:text-neutral-500" />
							{t('network.invitations')}
						</span>
						{#if (pending.total ?? 0) > 0}
							<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{pending.total}</span>
						{:else}
							<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">0</span>
						{/if}
					</a>
				</nav>
			</div>
		</aside>

		<!-- Main -->
		<main class="flex-1 min-w-0 flex flex-col gap-6">
			<!-- Invitations (always visible, preview of 2) -->
			<section id="invitations" class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
				<div class="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-neutral-800">
					<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
						{t('network.invitations')} ({pending.total ?? 0})
					</h2>
					{#if (pending.total ?? 0) > 0}
						<a href="/social/network/invitation-manager/received" class="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-300">
							{t('network.showAll')}
						</a>
					{/if}
				</div>
				{#if pending.data && pending.data.length > 0}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each pending.data.slice(0, 2) as request}
							{@const user = (request.user ?? request.requester ?? request) as Record<string, string | null>}
							{@const reqId = String(request.id ?? '')}
							<UserRow user={{ id: String(user.id ?? ''), name: user.name, username: user.username, photoURL: user.photoURL }}>
								{#snippet actions()}
									<Button variant="outline" size="sm" onclick={() => rejectMutation.mutate({ id: reqId })}>{t('network.ignore')}</Button>
									<Button variant="outline" intent="accent" size="sm" onclick={() => acceptMutation.mutate({ id: reqId })}>{t('network.accept')}</Button>
								{/snippet}
							</UserRow>
						{/each}
					</div>
				{:else}
					<div class="flex flex-col items-center gap-2 px-6 py-10 text-center">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
							<UserCheck size={18} class="text-gray-400 dark:text-neutral-500" />
						</div>
						<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">
							{t('network.invitationsEmptyTitle')}
						</p>
						<p class="max-w-sm text-xs text-gray-500 dark:text-neutral-500">
							{t('network.invitationsEmptyDescription')}
						</p>
					</div>
				{/if}
			</section>

			<!-- Suggestions carousel (widget) -->
			{#if suggestionsQuery.isLoading}
				<section class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
					<div class="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
						<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{t('network.suggestions')}</h2>
					</div>
					<div class="grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:px-5 sm:py-4 sm:gap-4">
						{#each Array(4) as _}
							<div class="flex flex-col items-center gap-2 rounded-xl border p-4 border-gray-200 dark:border-neutral-800 animate-pulse">
								<div class="h-14 w-14 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
								<div class="h-3 w-20 rounded bg-gray-200 dark:bg-neutral-700"></div>
								<div class="h-2 w-14 rounded bg-gray-200 dark:bg-neutral-700"></div>
								<div class="h-8 w-full rounded-full bg-gray-200 dark:bg-neutral-700"></div>
							</div>
						{/each}
					</div>
				</section>
			{:else if suggestionsList.length > 0}
				<div id="suggestions">
					<SuggestionsCarousel
						suggestions={suggestionsList.slice(0, 12).map((s) => ({
							id: String(s.id ?? ''),
							name: (s as Record<string, string | null>).name,
							username: (s as Record<string, string | null>).username,
							photoURL: (s as Record<string, string | null>).photoURL,
							reason: (s as Record<string, string | null>).reason,
						}))}
						seeAllHref="/social/network/suggestions"
					/>
				</div>
			{/if}

			<!-- Connections -->
			<section id="connections" class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
				<div class="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
					<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{t('network.connections')} ({connections.total})</h2>
				</div>
				{#if connectionsQuery.isLoading}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each Array(3) as _}
							<div class="flex items-center gap-3 px-5 py-3.5 animate-pulse">
								<div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
								<div class="flex-1 space-y-2">
									<div class="h-3 w-32 rounded bg-gray-200 dark:bg-neutral-700"></div>
									<div class="h-2 w-20 rounded bg-gray-200 dark:bg-neutral-700"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if connectionsList.length === 0}
					<p class="py-12 text-center text-sm text-gray-500 dark:text-neutral-500">{t('network.noConnections')}</p>
				{:else}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each connectionsList as connection}
							{@const user = (connection.user ?? connection) as Record<string, string | null>}
							{@const connId = String(connection.id ?? '')}
							{@const userName = String(user.name ?? user.username ?? '?')}
							<UserRow user={{ id: String(user.id ?? ''), name: user.name, username: user.username, photoURL: user.photoURL }}>
								{#snippet actions()}
									<Button variant="outline" size="sm" onclick={() => chatState.startConversationWith(String(user.id ?? ''))}>
										<MessageCircle size={12} />
										{t('network.message')}
									</Button>
									<Button variant="ghost" intent="danger" size="xs" onclick={() => removeTarget = { id: connId, name: userName }}>
										{t('network.remove')}
									</Button>
								{/snippet}
							</UserRow>
						{/each}
						<InfiniteScrollTrigger onLoadMore={loadMoreConnections} hasMore={connectionsPage < (connections.totalPages ?? 0)} isLoading={connectionsLoading} />
					</div>
				{/if}
			</section>

			<!-- Followers & Following -->
			<section id="followers" class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
				<div class="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
					<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
						{t('network.followers')} ({followers.total}) · {t('network.following')} ({following.total})
					</h2>
				</div>
				{#if followersQuery.isLoading}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#each Array(3) as _}
							<div class="flex items-center gap-3 px-5 py-3 animate-pulse">
								<div class="h-8 w-8 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
								<div class="flex-1"><div class="h-3 w-28 rounded bg-gray-200 dark:bg-neutral-700"></div></div>
							</div>
						{/each}
					</div>
				{:else if !followers.total && !following.total}
					<p class="py-8 text-center text-sm text-gray-500 dark:text-neutral-500">{t('network.noFollowers')}</p>
				{:else}
					<div class="divide-y divide-gray-200 dark:divide-neutral-800">
						{#if followers.data}
							{#each followers.data as follower}
								{@const user = (follower.user ?? follower.follower ?? follower) as Record<string, string | null>}
								<UserRow user={{ id: String(user.id ?? ''), name: user.name, username: user.username, photoURL: user.photoURL }} badge="follower" />
							{/each}
						{/if}
						{#if following.data}
							{#each following.data as followed}
								{@const user = (followed.user ?? followed.following ?? followed) as Record<string, string | null>}
								<UserRow user={{ id: String(user.id ?? ''), name: user.name, username: user.username, photoURL: user.photoURL }} badge="following" />
							{/each}
						{/if}
					</div>
				{/if}
			</section>
		</main>
	</div>
</div>
