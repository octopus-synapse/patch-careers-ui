<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createDeleteV1UsersUserIdFollow,
  createPostV1UsersUserIdFollow,
  createGetV1UsersUserIdFollowers,
  getV1UsersUserIdFollowers,
  getV1UsersUserIdFollowersQueryKey,
} from 'api-client';
import { Users } from 'lucide-svelte';
import { Button, EmptyState, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { asIcon } from '$lib/types/icons';
import { track } from '$lib/utils/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import UserRow from '$lib/components/user/user-row.svelte';
import { locale } from '$lib/state/locale.svelte';
import { InfiniteScrollTrigger } from 'ui';
import { useInfiniteList } from '$lib/state/use-infinite-list.svelte';
import type { Follower } from '$lib/types/social';

const t = $derived(locale.t);
const auth = useAuth();
const currentUserId = $derived(String(auth.userId ?? ''));

const list = useInfiniteList<Follower>({
  createQuery: (p) =>
    createGetV1UsersUserIdFollowers(currentUserId, p, {
      query: { enabled: browser && !!currentUserId },
    }),
  fetcher: (p) => getV1UsersUserIdFollowers(currentUserId, p),
});

let optimisticOverrides = $state<Record<string, boolean>>({});

const queryClient = useQueryClient();

const followMutation = createPostV1UsersUserIdFollow({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getV1UsersUserIdFollowersQueryKey(currentUserId) });
      track('user_followed', { targetUserId: vars.userId, source: 'followers_page' });
    },
    onError(_err, vars) {
      optimisticOverrides = { ...optimisticOverrides, [vars.userId]: false };
      toastState.show(t('network.followError'), 'danger');
    },
  },
});

const unfollowMutation = createDeleteV1UsersUserIdFollow({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getV1UsersUserIdFollowersQueryKey(currentUserId) });
      track('user_unfollowed', { targetUserId: vars.userId, source: 'followers_page' });
    },
    onError(_err, vars) {
      optimisticOverrides = { ...optimisticOverrides, [vars.userId]: true };
      toastState.show(t('network.unfollowError'), 'danger');
    },
  },
});

function effectiveFollowed(row: Follower): boolean {
  const id = row.follower?.id ?? '';
  return optimisticOverrides[id] ?? row.isFollowedByMe ?? false;
}

function handleToggleFollow(row: Follower) {
  const id = row.follower?.id ?? '';
  if (!id) return;
  const current = effectiveFollowed(row);
  optimisticOverrides = { ...optimisticOverrides, [id]: !current };
  if (current) $unfollowMutation.mutate({ userId: id });
  else $followMutation.mutate({ userId: id });
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
			{#if list.total > 0}
				<span class="text-xs text-gray-500 dark:text-neutral-500">{list.total}</span>
			{/if}
		</header>

		<section class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
			{#if list.isLoading}
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
			{:else if list.items.length === 0}
				<EmptyState
					message={t('network.followersEmpty')}
					icon={asIcon(Users)}
				/>
			{:else}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each list.items as row (row.follower?.id ?? row.id)}
						{@const followed = effectiveFollowed(row)}
						{#if row.follower}
							<UserRow user={row.follower}>
								{#snippet actions()}
									<Button
										variant={followed ? 'outline' : 'solid'}
										size="sm"
										textCase="normal"
										onclick={() => handleToggleFollow(row)}
									>
										{followed ? t('network.unfollow') : t('network.follow')}
									</Button>
								{/snippet}
							</UserRow>
						{/if}
					{/each}
				</div>
				<InfiniteScrollTrigger
					onLoadMore={list.loadMore}
					hasMore={list.hasMore}
					isLoading={list.loadingMore}
				/>
			{/if}
		</section>
	</div>
</div>
