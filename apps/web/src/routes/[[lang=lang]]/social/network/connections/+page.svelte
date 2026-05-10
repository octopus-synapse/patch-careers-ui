<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createDeleteV1ConnectionsIdWithdraw,
  createGetV1UsersMeConnections,
  getV1UsersMeConnections,
  getV1UsersMeConnectionsQueryKey,
} from 'api-client';
import { ChevronDown, MessageCircle, MoreHorizontal, Search, Users } from 'lucide-svelte';
import { Avatar, Button, ConfirmModal, Input, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { chatState } from '$lib/state/chat-state.svelte';
import { locale } from '$lib/state/locale.svelte';
import { InfiniteScrollTrigger } from 'ui';
import { useInfiniteList } from '$lib/state/use-infinite-list.svelte';
import type { Connection } from '$lib/types/social';

const t = $derived(locale.t);

const list = useInfiniteList<Connection>({
  createQuery: (p) => createGetV1UsersMeConnections(p, { query: { enabled: browser } }),
  fetcher: (p) => getV1UsersMeConnections(p),
});

type SortKey = 'recent' | 'first' | 'last';
let sortKey = $state<SortKey>('recent');
let sortOpen = $state(false);
let query = $state('');

function userOf(c: Connection) {
  return c.user ?? c.target ?? c.requester;
}

const filtered = $derived.by(() => {
  const q = query.trim().toLowerCase();
  const items = list.items;
  const head = q
    ? items.filter((c) => {
        const u = userOf(c);
        const name = (u?.name ?? '').toLowerCase();
        const username = (u?.username ?? '').toLowerCase();
        return name.includes(q) || username.includes(q);
      })
    : items;

  const sorted = [...head];
  if (sortKey === 'recent') {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sortKey === 'first') {
    sorted.sort((a, b) => (userOf(a)?.name ?? '').localeCompare(userOf(b)?.name ?? ''));
  } else if (sortKey === 'last') {
    sorted.sort((a, b) => {
      const la = (userOf(a)?.name ?? '').split(' ').slice(-1)[0] ?? '';
      const lb = (userOf(b)?.name ?? '').split(' ').slice(-1)[0] ?? '';
      return la.localeCompare(lb);
    });
  }
  return sorted;
});

const sortLabel = $derived.by(() => {
  if (!t) return '';
  if (sortKey === 'first') return t('network.sortFirstName');
  if (sortKey === 'last') return t('network.sortLastName');
  return t('network.sortRecentlyAdded');
});

function formatConnectedOn(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale.current === 'pt-BR' ? 'pt-BR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const queryClient = useQueryClient();
let removeTarget = $state<{ id: string; name: string } | null>(null);
let menuOpenFor = $state<string | null>(null);

const removeMutation = createDeleteV1ConnectionsIdWithdraw({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getV1UsersMeConnectionsQueryKey() });
      list.reset();
      removeTarget = null;
    },
  },
});
</script>

<svelte:head>
	<title>{t?.('network.connectionsPageTitle') ?? 'Connections'}</title>
</svelte:head>

<ConfirmModal
	open={removeTarget !== null}
	onClose={() => (removeTarget = null)}
	onConfirm={() => {
		if (removeTarget) $removeMutation.mutate({ id: removeTarget.id });
	}}
	title={t?.('network.removeConfirmTitle') ?? 'Remove'}
	message={(t?.('network.removeConfirmMessage') ?? 'Remove {name}?').replace(
		'{name}',
		removeTarget?.name ?? '',
	)}
/>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-3xl px-3 sm:px-6">
		<section class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
			<!-- Header -->
			<div class="px-4 pt-5 pb-4 sm:px-6">
				<h1 class="text-base font-semibold text-gray-800 dark:text-neutral-200">
					{(t?.('network.connectionsCount') ?? '{n} connections').replace(
						'{n}',
						String(list.total),
					)}
				</h1>
			</div>

			<!-- Controls -->
			<div class="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 border-gray-200 dark:border-neutral-800">
				<!-- Sort dropdown -->
				<div class="relative">
					<button
						type="button"
						onclick={() => (sortOpen = !sortOpen)}
						class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
					>
						<span class="text-gray-500 dark:text-neutral-400">{t?.('network.sortBy')}</span>
						<span class="font-medium">{sortLabel}</span>
						<ChevronDown size={12} class="text-gray-500 dark:text-neutral-400" />
					</button>
					{#if sortOpen}
						<div
							class="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white shadow-lg border-gray-200 dark:border-neutral-700 dark:bg-neutral-800"
						>
							{#each [{ k: 'recent', l: t?.('network.sortRecentlyAdded') }, { k: 'first', l: t?.('network.sortFirstName') }, { k: 'last', l: t?.('network.sortLastName') }] as opt}
								<button
									type="button"
									class="block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700 {sortKey === opt.k ? 'font-semibold text-emerald-600 dark:text-emerald-300' : 'text-gray-700 dark:text-neutral-300'}"
									onclick={() => {
										sortKey = opt.k as SortKey;
										sortOpen = false;
									}}
								>
									{opt.l}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<div class="flex items-center gap-3">
					<div class="relative flex-1 sm:w-64">
						<Search
							size={14}
							class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
						/>
						<Input
							bind:value={query}
							placeholder={t?.('network.searchByName') ?? 'Search by name'}
							class="pl-8 text-xs"
						/>
					</div>
				</div>
			</div>

			<!-- List -->
			{#if list.isLoading}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each Array(5) as _}
						<div class="flex items-center gap-3 px-6 py-4">
							<Skeleton shape="avatar" width="3rem" height="3rem" />
							<div class="flex-1 space-y-2">
								<Skeleton height="0.75rem" width="10rem" />
								<Skeleton height="0.5rem" width="6rem" />
							</div>
							<Skeleton height="1.75rem" width="5rem" class="rounded-full" />
						</div>
					{/each}
				</div>
			{:else if filtered.length === 0}
				<div class="flex flex-col items-center gap-2 px-6 py-16 text-center">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
						<Users size={18} class="text-gray-400 dark:text-neutral-500" />
					</div>
					<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">
						{query ? 'No matches' : (t?.('network.noConnections') ?? 'No connections yet')}
					</p>
				</div>
			{:else}
				<ul class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each filtered as conn (conn.id)}
						{@const u = userOf(conn)}
						{@const displayName = u?.name ?? u?.username ?? '?'}
						<li class="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
							<a href="/my-profile/public/@{u?.username ?? ''}" class="flex-shrink-0">
								<Avatar name={displayName} photoURL={u?.photoURL} size="lg" />
							</a>
							<div class="min-w-0 flex-1">
								<a
									href="/my-profile/public/@{u?.username ?? ''}"
									class="block truncate text-sm font-semibold text-gray-800 hover:underline dark:text-neutral-200"
								>
									{displayName}
								</a>
								{#if u?.username}
									<p class="truncate text-xs text-gray-500 dark:text-neutral-500">
										@{u.username}
									</p>
								{/if}
								{#if conn.createdAt}
									<p class="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-500">
										{(t?.('network.connectedOn') ?? 'Connected on {date}').replace(
											'{date}',
											formatConnectedOn(conn.createdAt),
										)}
									</p>
								{/if}
							</div>
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									textCase="normal"
									onclick={() => chatState.startConversationWith(u?.id ?? '')}
								>
									<MessageCircle size={12} />
									{t?.('network.message')}
								</Button>
								<div class="relative">
									<button
										type="button"
										aria-label="More"
										class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700"
										onclick={() => (menuOpenFor = menuOpenFor === conn.id ? null : conn.id)}
									>
										<MoreHorizontal size={16} class="text-gray-600 dark:text-neutral-300" />
									</button>
									{#if menuOpenFor === conn.id}
										<div
											class="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border bg-white shadow-lg border-gray-200 dark:border-neutral-700 dark:bg-neutral-800"
										>
											<button
												type="button"
												class="block w-full px-3 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
												onclick={() => {
													removeTarget = { id: conn.id, name: displayName };
													menuOpenFor = null;
												}}
											>
												{t?.('network.remove')}
											</button>
										</div>
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ul>
				<InfiniteScrollTrigger
					onLoadMore={list.loadMore}
					hasMore={list.hasMore}
					isLoading={list.loadingMore}
				/>
			{/if}
		</section>
	</div>
</div>
