<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createFollowFollow,
  createFollowGetFollowers,
  createFollowUnfollow,
  type FollowListDataDtoFollowersDataItem,
  followGetFollowers,
  getFollowGetFollowersQueryKey,
} from 'api-client';
import { Users } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Button, EmptyState, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { track } from '$lib/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import UserRow from '$lib/components/user-row.svelte';
import { locale } from '$lib/state/locale.svelte';
import InfiniteScrollTrigger from '$lib/components/data/infinite-scroll-trigger.svelte';

const t = $derived(locale.t);
const auth = useAuth();
const currentUserId = $derived(String(auth.data?.user?.id ?? ''));

const query = createFollowGetFollowers(
  () => currentUserId,
  () => ({ page: 1, limit: 20 }),
  () => ({ query: { enabled: browser && !!currentUserId } }),
);

type FollowerRow = {
  id: string;
  name?: string | null;
  username?: string | null;
  photoURL?: string | null;
  isFollowedByMe: boolean;
};

function rowsFrom(items?: FollowListDataDtoFollowersDataItem[]): FollowerRow[] {
  return (items ?? []).map((row) => ({
    id: row.follower?.id ?? '',
    name: row.follower?.name ?? null,
    username: row.follower?.username ?? null,
    photoURL: row.follower?.photoURL ?? null,
    isFollowedByMe: row.isFollowedByMe ?? false,
  }));
}

function pagedSection(data: unknown): {
  rows: FollowerRow[];
  totalPages: number;
  total: number;
} {
  const outer = data as Record<string, unknown> | undefined;
  const section = outer?.followers as
    | { data?: FollowListDataDtoFollowersDataItem[]; totalPages?: number; total?: number }
    | undefined;
  return {
    rows: rowsFrom(section?.data),
    totalPages: section?.totalPages ?? 0,
    total: section?.total ?? 0,
  };
}

const firstPage = $derived(pagedSection(query.data));
let extra = $state<FollowerRow[]>([]);
let pageNum = $state(1);
let loadingMore = $state(false);
let optimisticOverrides = $state<Record<string, boolean>>({});

async function loadMore() {
  if (loadingMore || !currentUserId) return;
  loadingMore = true;
  try {
    const next = pageNum + 1;
    const res = (await followGetFollowers(currentUserId, {
      page: next,
      limit: 20,
    })) as unknown as Record<string, unknown> | undefined;
    const section = res?.followers as { data?: FollowListDataDtoFollowersDataItem[] } | undefined;
    extra = [...extra, ...rowsFrom(section?.data)];
    pageNum = next;
  } finally {
    loadingMore = false;
  }
}

const all = $derived([...firstPage.rows, ...extra]);

const queryClient = useQueryClient();

const followMutation = createFollowFollow(() => ({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getFollowGetFollowersQueryKey(currentUserId) });
      track('user_followed', { targetUserId: vars.userId, source: 'followers_page' });
    },
    onError(_err, vars) {
      optimisticOverrides = { ...optimisticOverrides, [vars.userId]: false };
      toastState.show(t('network.followError'), 'danger');
    },
  },
}));

const unfollowMutation = createFollowUnfollow(() => ({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getFollowGetFollowersQueryKey(currentUserId) });
      track('user_unfollowed', { targetUserId: vars.userId, source: 'followers_page' });
    },
    onError(_err, vars) {
      optimisticOverrides = { ...optimisticOverrides, [vars.userId]: true };
      toastState.show(t('network.unfollowError'), 'danger');
    },
  },
}));

function effectiveFollowed(row: FollowerRow): boolean {
  return optimisticOverrides[row.id] ?? row.isFollowedByMe;
}

function handleToggleFollow(row: FollowerRow) {
  const current = effectiveFollowed(row);
  optimisticOverrides = { ...optimisticOverrides, [row.id]: !current };
  if (current) unfollowMutation.mutate({ userId: row.id });
  else followMutation.mutate({ userId: row.id });
}
</script>

<svelte:head>
	<title>{t('network.pageFollowersTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-3xl px-3 sm:px-6">
		<header class="mb-4 flex items-center justify-between">
			<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">
				{t('network.pageFollowersTitle')}
			</h1>
			{#if firstPage.total > 0}
				<span class="text-xs text-gray-500 dark:text-neutral-500">{firstPage.total}</span>
			{/if}
		</header>

		<section class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
			{#if query.isLoading}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each Array(6) as _}
						<div class="flex items-center gap-3 px-4 py-4 sm:px-6">
							<Skeleton shape="avatar" width="3rem" height="3rem" />
							<div class="flex-1 space-y-2">
								<Skeleton shape="text" width="40%" />
								<Skeleton shape="text" width="25%" />
							</div>
							<Skeleton shape="rect" width="5rem" height="2rem" />
						</div>
					{/each}
				</div>
			{:else if all.length === 0}
				<EmptyState
					message={t('network.followersEmpty')}
					icon={Users as unknown as Component<{ size: number; class?: string }>}
				/>
			{:else}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each all as follower (follower.id)}
						{@const followed = effectiveFollowed(follower)}
						<UserRow
							user={{
								id: follower.id,
								name: follower.name,
								username: follower.username,
								photoURL: follower.photoURL,
							}}
						>
							{#snippet actions()}
								<Button
									variant={followed ? 'outline' : 'solid'}
									size="sm"
									onclick={() => handleToggleFollow(follower)}
								>
									{followed ? t('network.unfollow') : t('network.follow')}
								</Button>
							{/snippet}
						</UserRow>
					{/each}
				</div>
				<InfiniteScrollTrigger
					onLoadMore={loadMore}
					hasMore={pageNum < firstPage.totalPages}
					isLoading={loadingMore}
				/>
			{/if}
		</section>
	</div>
</div>
