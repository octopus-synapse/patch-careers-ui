<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createPutV1ConnectionsIdAccept,
  createPutV1ConnectionsIdReject,
  createGetV1UsersMeConnectionsPending,
  getV1UsersMeConnectionsPending,
  getV1UsersMeConnectionsPendingQueryKey,
} from 'api-client';
import { UserCheck } from 'lucide-svelte';
import { Avatar, Button, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { locale } from '$lib/state/locale.svelte';
import { InfiniteScrollTrigger } from 'ui';
import { useInfiniteList } from '$lib/state/use-infinite-list.svelte';
import type { PendingConnection } from '$lib/types/social';

const t = $derived(locale.t);

const list = useInfiniteList<PendingConnection>({
  createQuery: (p) => createGetV1UsersMeConnectionsPending(p, { query: { enabled: () => browser} }),
  fetcher: (p) => getV1UsersMeConnectionsPending(p),
});

function userOf(r: PendingConnection) {
  return r.user ?? r.requester ?? r.target;
}

const queryClient = useQueryClient();

const acceptMutation = createPutV1ConnectionsIdAccept({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getV1UsersMeConnectionsPendingQueryKey() });
    },
  },
});

const rejectMutation = createPutV1ConnectionsIdReject({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getV1UsersMeConnectionsPendingQueryKey() });
    },
  },
});

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return locale.current === 'pt-BR' ? 'agora' : 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  const days = Math.floor(secs / 86400);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}
</script>

<svelte:head>
	<title>{t?.('network.manageInvitations')}</title>
</svelte:head>

<div class="px-4 py-3 sm:px-6">
	<div class="flex flex-wrap items-center gap-2">
		<span class="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white">
			{t?.('network.people')} ({list.total})
		</span>
	</div>
</div>

{#if list.isLoading}
	<div class="divide-y divide-gray-200 dark:divide-neutral-800">
		{#each Array(4) as _}
			<div class="flex items-center gap-3 px-4 py-4 sm:px-6">
				<Skeleton shape="avatar" width="3rem" height="3rem" />
				<div class="flex-1 space-y-2">
					<Skeleton height="0.75rem" width="10rem" />
					<Skeleton height="0.5rem" width="6rem" />
				</div>
				<Skeleton height="1.75rem" width="5rem" class="rounded-full" />
			</div>
		{/each}
	</div>
{:else if list.items.length === 0}
	<div class="flex flex-col items-center gap-2 px-6 py-16 text-center">
		<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
			<UserCheck size={18} class="text-gray-400 dark:text-neutral-500" />
		</div>
		<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">
			{t?.('network.invitationsEmptyTitle')}
		</p>
		<p class="max-w-sm text-xs text-gray-500 dark:text-neutral-500">
			{t?.('network.invitationsEmptyDescription')}
		</p>
	</div>
{:else}
	<ul class="divide-y divide-gray-200 dark:divide-neutral-800">
		{#each list.items as req (req.id)}
			{@const u = userOf(req)}
			{@const displayName = u?.name ?? u?.username ?? '?'}
			<li class="flex items-start gap-3 px-4 py-4 sm:px-6">
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
						<p class="truncate text-xs text-gray-500 dark:text-neutral-500">@{u.username}</p>
					{/if}
					{#if req.createdAt}
						<p class="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-500">
							{timeAgo(req.createdAt)}
						</p>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" textCase="normal" onclick={() => $rejectMutation.mutate({ id: req.id })}>
						{t?.('network.ignore')}
					</Button>
					<Button variant="outline" intent="accent" size="sm" textCase="normal" onclick={() => $acceptMutation.mutate({ id: req.id })}>
						{t?.('network.accept')}
					</Button>
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
