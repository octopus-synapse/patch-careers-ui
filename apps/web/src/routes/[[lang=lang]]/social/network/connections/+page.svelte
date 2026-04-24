<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createConnectionGetConnections,
  createConnectionRemoveConnection,
  customFetch,
  getConnectionGetConnectionsQueryKey,
} from 'api-client';
import { ChevronDown, MessageCircle, MoreHorizontal, Search, Users } from 'lucide-svelte';
import { Avatar, Button, ConfirmModal, Input } from 'ui';
import { browser } from '$app/environment';
import { chatState } from '$lib/state/chat-state.svelte';
import { locale } from '$lib/state/locale.svelte';
import InfiniteScrollTrigger from '$lib/components/data/infinite-scroll-trigger.svelte';

const t = $derived(locale.t);

type ConnectionUser = {
  id: string | null;
  name: string | null;
  username: string | null;
  photoURL: string | null;
};

type ConnectionRecord = {
  id: string;
  createdAt: string;
  user: ConnectionUser;
};

const connectionsQuery = createConnectionGetConnections(
  () => ({ page: 1, limit: 20 }),
  () => ({ query: { enabled: browser } }),
);

function extractRecord(raw: Record<string, unknown>): ConnectionRecord {
  const rawUser = (raw.user ?? raw.target ?? raw.requester ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    createdAt: String(raw.createdAt ?? raw.acceptedAt ?? raw.updatedAt ?? ''),
    user: {
      id: (rawUser.id as string | null) ?? null,
      name: (rawUser.name as string | null) ?? null,
      username: (rawUser.username as string | null) ?? null,
      photoURL: (rawUser.photoURL as string | null) ?? null,
    },
  };
}

const firstPage = $derived.by(() => {
  const outer = connectionsQuery.data as Record<string, unknown> | undefined;
  const section = outer?.connections as Record<string, unknown> | undefined;
  const items = (section?.data ?? []) as Record<string, unknown>[];
  return {
    data: items.map(extractRecord),
    total: (section?.total as number | undefined) ?? 0,
    totalPages: (section?.totalPages as number | undefined) ?? 0,
  };
});

let extra = $state<ConnectionRecord[]>([]);
let page = $state(1);
let loadingMore = $state(false);

async function loadMore() {
  if (loadingMore) return;
  loadingMore = true;
  try {
    const next = page + 1;
    const res = await customFetch<Record<string, unknown>>(
      `/api/v1/users/me/connections?page=${next}&limit=20`,
    );
    const section = res?.connections as Record<string, unknown> | undefined;
    const items = (section?.data as Record<string, unknown>[] | undefined) ?? [];
    extra = [...extra, ...items.map(extractRecord)];
    page = next;
  } finally {
    loadingMore = false;
  }
}

type SortKey = 'recent' | 'first' | 'last';
let sortKey = $state<SortKey>('recent');
let sortOpen = $state(false);
let query = $state('');

const allConnections = $derived([...firstPage.data, ...extra]);

const filtered = $derived.by(() => {
  const q = query.trim().toLowerCase();
  const list = q
    ? allConnections.filter((c) => {
        const name = (c.user.name ?? '').toLowerCase();
        const username = (c.user.username ?? '').toLowerCase();
        return name.includes(q) || username.includes(q);
      })
    : allConnections;

  const sorted = [...list];
  if (sortKey === 'recent') {
    sorted.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  } else if (sortKey === 'first') {
    sorted.sort((a, b) => (a.user.name ?? '').localeCompare(b.user.name ?? ''));
  } else if (sortKey === 'last') {
    sorted.sort((a, b) => {
      const la = (a.user.name ?? '').split(' ').slice(-1)[0] ?? '';
      const lb = (b.user.name ?? '').split(' ').slice(-1)[0] ?? '';
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

const removeMutation = createConnectionRemoveConnection(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getConnectionGetConnectionsQueryKey() });
      extra = extra.filter((c) => c.id !== removeTarget?.id);
      removeTarget = null;
    },
  },
}));
</script>

<svelte:head>
	<title>{t?.('network.connectionsPageTitle') ?? 'Connections'}</title>
</svelte:head>

<ConfirmModal
	open={removeTarget !== null}
	onClose={() => (removeTarget = null)}
	onConfirm={() => {
		if (removeTarget) removeMutation.mutate({ id: removeTarget.id });
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
						String(firstPage.total),
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
			{#if connectionsQuery.isLoading}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each Array(5) as _}
						<div class="flex items-center gap-3 px-6 py-4 animate-pulse">
							<div class="h-12 w-12 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
							<div class="flex-1 space-y-2">
								<div class="h-3 w-40 rounded bg-gray-200 dark:bg-neutral-700"></div>
								<div class="h-2 w-24 rounded bg-gray-200 dark:bg-neutral-700"></div>
							</div>
							<div class="h-7 w-20 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
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
						{@const displayName = conn.user.name ?? conn.user.username ?? '?'}
						<li class="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
							<a href="/my-profile/public/@{conn.user.username ?? ''}" class="flex-shrink-0">
								<Avatar name={displayName} photoURL={conn.user.photoURL} size="lg" />
							</a>
							<div class="min-w-0 flex-1">
								<a
									href="/my-profile/public/@{conn.user.username ?? ''}"
									class="block truncate text-sm font-semibold text-gray-800 hover:underline dark:text-neutral-200"
								>
									{displayName}
								</a>
								{#if conn.user.username}
									<p class="truncate text-xs text-gray-500 dark:text-neutral-500">
										@{conn.user.username}
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
									onclick={() => chatState.startConversationWith(conn.user.id ?? '')}
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
					onLoadMore={loadMore}
					hasMore={page < firstPage.totalPages}
					isLoading={loadingMore}
				/>
			{/if}
		</section>
	</div>
</div>
