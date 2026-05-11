<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createDeleteV1UsersUserIdFollow,
  createGetV1UsersUserIdFollowing,
  getV1UsersUserIdFollowing,
  getV1UsersUserIdFollowingQueryKey,
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
import type { Following } from '$lib/types/social';

const t = $derived(locale.t);
const auth = useAuth();
const currentUserId = $derived(String(auth.userId ?? ''));

let hiddenIds = $state<Set<string>>(new Set());

const list = useInfiniteList<Following>({
  createQuery: (p) =>
    createGetV1UsersUserIdFollowing(currentUserId, p, {
      query: { enabled: browser && !!currentUserId },
    }),
  fetcher: (p) => getV1UsersUserIdFollowing(currentUserId, p),
  filter: (row) => !hiddenIds.has(row.following?.id ?? ''),
});

const queryClient = useQueryClient();

const unfollowMutation = createDeleteV1UsersUserIdFollow({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getV1UsersUserIdFollowingQueryKey(currentUserId) });
      track('user_unfollowed', { targetUserId: vars.userId, source: 'following_page' });
    },
    onError(_err, vars) {
      const next = new Set(hiddenIds);
      next.delete(vars.userId);
      hiddenIds = next;
      toastState.show(t('network.unfollowError'), 'danger');
    },
  },
});

function handleUnfollow(userId: string) {
  hiddenIds = new Set([...hiddenIds, userId]);
  $unfollowMutation.mutate({ userId });
}
</script>

<svelte:head>
	<title>{t('network.pageFollowingTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-3xl px-3 sm:px-6">
		<header class="mb-4 flex items-center justify-between">
			<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">
				{t('network.pageFollowingTitle')}
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
					message={t('network.followingEmpty')}
					icon={asIcon(Users)}
				/>
			{:else}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each list.items as row (row.following?.id ?? row.id)}
						{#if row.following}
							<UserRow user={row.following}>
								{#snippet actions()}
									<Button variant="outline" size="sm" textCase="normal" onclick={() => row.following && handleUnfollow(row.following.id)}>
										{t('network.unfollow')}
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
