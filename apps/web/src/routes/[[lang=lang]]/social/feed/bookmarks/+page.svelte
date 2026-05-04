<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { createFeedBookmarks, feedBookmarksQueryKey } from 'api-client';
import { ArrowLeft } from 'lucide-svelte';
import { Button, Loader } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import PostCard from '../_components/post-card.svelte';
import { useAuth } from '$lib/state/auth.svelte';
import { useFeedEngagement } from '$lib/state/use-feed-engagement.svelte';
import { useFeedPagination } from '$lib/state/use-feed-pagination.svelte';

/**
 * Bookmarked posts page — frontend BURRO. Backend pagination envelope
 * (`{posts, nextCursor}`) is fed straight into `useFeedPagination` (which
 * keys it as `items`). The engagement overlay (likes, bookmarks, repost,
 * report, delete, vote) is the same shared `useFeedEngagement` hook the
 * timeline uses, so optimistic updates and undo behave identically.
 */

const session = useAuth();
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);
const currentUserId = $derived(String(user?.id ?? ''));

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

const queryClient = useQueryClient();

const pagination = useFeedPagination({
  getRawData: () => {
    const data = $bookmarksQuery.data;
    if (!data) return undefined;
    return { items: data.posts, nextCursor: data.nextCursor };
  },
});

const engagement = useFeedEngagement({
  getPosts: () => pagination.allPosts,
  setPosts: (posts) => {
    pagination.allPosts = posts;
  },
});

const bookmarksQuery = createFeedBookmarks(
  { cursor: pagination.cursor, limit: '20' },
  { query: { enabled: authenticated } },
);

let sentinelEl: HTMLDivElement | undefined = $state();

$effect(() => {
  if (!sentinelEl || !browser) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        pagination.hasMore &&
        !$bookmarksQuery.isLoading &&
        !pagination.loadingMore
      ) {
        pagination.loadNextPage();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(sentinelEl);
  return () => observer.disconnect();
});

function handleRepost(id: string) {
  void engagement.submitRepost(id, '');
  queryClient.invalidateQueries({ queryKey: feedBookmarksQueryKey() });
}

function handleReport(id: string) {
  void engagement.submitReport(id, '');
}
</script>

<svelte:head>
	<title>Bookmarks</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader size={24} />
	</div>
{:else if authenticated}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto max-w-2xl px-4">
			<div class="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="xs" onclick={() => goto('/social/feed')}>
					<ArrowLeft size={16} />
				</Button>
				<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Bookmarks</h1>
			</div>

			<div class="space-y-4">
				{#each pagination.allPosts as post (String(post.id))}
					<PostCard
						post={{
							...post,
							isLiked: engagement.isPostLiked(post),
							isBookmarked: engagement.isPostBookmarked(post),
						}}
						{currentUserId}
						onlike={engagement.handleLike}
						onunlike={engagement.handleUnlike}
						onbookmark={engagement.handleBookmark}
						onunbookmark={engagement.handleUnbookmark}
						ondelete={engagement.handleDelete}
						onrepost={handleRepost}
						onreport={handleReport}
						onvote={engagement.handleVote}
					/>
				{/each}
			</div>

			{#if $bookmarksQuery.isLoading && pagination.allPosts.length === 0}
				<div class="flex justify-center py-12">
					<Loader size={24} />
				</div>
			{:else if pagination.allPosts.length === 0 && !$bookmarksQuery.isLoading}
				<div class="py-12 text-center">
					<p class="text-sm text-gray-400 dark:text-neutral-500">No bookmarks yet.</p>
				</div>
			{/if}

			{#if pagination.hasMore && pagination.allPosts.length > 0}
				<div bind:this={sentinelEl} class="flex justify-center py-8">
					{#if pagination.loadingMore}
						<Loader size={20} />
					{/if}
				</div>
			{/if}
		</main>
	</div>
{/if}
