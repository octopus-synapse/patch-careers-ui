<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createAuthSession,
  createFeedGetBookmarks,
  engagementBookmark,
  engagementLike,
  engagementReport,
  engagementRepost,
  engagementUnbookmark,
  engagementUnlike,
  getFeedGetBookmarksQueryKey,
  postsDelete,
} from 'api-client';
import { ArrowLeft, Loader2 } from 'lucide-svelte';
import { Button } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import PostCard from '$lib/components/feed/post-card.svelte';

const session = createAuthSession(() => ({
  query: { retry: false, enabled: browser },
}));
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);
const currentUserId = $derived(String(user?.id ?? ''));

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/login');
  }
});

let cursor = $state<string | undefined>(undefined);
let allPosts = $state<Record<string, unknown>[]>([]);
let hasMore = $state(true);
let loadingMore = $state(false);

let likedPosts = $state<Set<string>>(new Set());
let unlikedPosts = $state<Set<string>>(new Set());
let bookmarkedPosts = $state<Set<string>>(new Set());
let unbookmarkedPosts = $state<Set<string>>(new Set());

const queryClient = useQueryClient();

const bookmarksQuery = createFeedGetBookmarks(
  () => ({ cursor, limit: 20 }),
  () => ({
    query: { enabled: authenticated },
  }),
);

const rawData = $derived(bookmarksQuery.data);

$effect(() => {
  if (!rawData) return;
  const postsArr = (Array.isArray(rawData) ? rawData : rawData?.posts) as
    | Record<string, unknown>[]
    | undefined;
  if (!postsArr) return;

  const nextCursor = rawData?.nextCursor;

  if (cursor === undefined) {
    allPosts = postsArr;
  } else {
    const existingIds = new Set(allPosts.map((p) => String(p.id)));
    const newPosts = postsArr.filter((p) => !existingIds.has(String(p.id)));
    if (newPosts.length > 0) {
      allPosts = [...allPosts, ...newPosts];
    }
  }

  hasMore = !!nextCursor && postsArr.length > 0;
  loadingMore = false;
});

let sentinelEl: HTMLDivElement | undefined = $state();

$effect(() => {
  if (!sentinelEl || !browser) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !bookmarksQuery.isLoading && !loadingMore) {
        loadNextPage();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(sentinelEl);
  return () => observer.disconnect();
});

function loadNextPage() {
  if (!rawData || loadingMore) return;
  const nextCursor = rawData?.nextCursor;
  if (nextCursor) {
    loadingMore = true;
    cursor = nextCursor;
  }
}

function isPostLiked(post: Record<string, unknown>): boolean {
  const id = String(post.id);
  if (likedPosts.has(id)) return true;
  if (unlikedPosts.has(id)) return false;
  return Boolean(post.isLiked ?? post.liked ?? false);
}

function isPostBookmarked(post: Record<string, unknown>): boolean {
  const id = String(post.id);
  if (bookmarkedPosts.has(id)) return true;
  if (unbookmarkedPosts.has(id)) return false;
  return Boolean(post.isBookmarked ?? post.bookmarked ?? true);
}

async function handleLike(id: string) {
  likedPosts = new Set([...likedPosts, id]);
  unlikedPosts = new Set([...unlikedPosts].filter((x) => x !== id));
  await engagementLike(id);
  queryClient.invalidateQueries({ queryKey: getFeedGetBookmarksQueryKey() });
}

async function handleUnlike(id: string) {
  unlikedPosts = new Set([...unlikedPosts, id]);
  likedPosts = new Set([...likedPosts].filter((x) => x !== id));
  await engagementUnlike(id);
  queryClient.invalidateQueries({ queryKey: getFeedGetBookmarksQueryKey() });
}

async function handleBookmark(id: string) {
  bookmarkedPosts = new Set([...bookmarkedPosts, id]);
  unbookmarkedPosts = new Set([...unbookmarkedPosts].filter((x) => x !== id));
  await engagementBookmark(id);
  queryClient.invalidateQueries({ queryKey: getFeedGetBookmarksQueryKey() });
}

async function handleUnbookmark(id: string) {
  unbookmarkedPosts = new Set([...unbookmarkedPosts, id]);
  bookmarkedPosts = new Set([...bookmarkedPosts].filter((x) => x !== id));
  await engagementUnbookmark(id);
  queryClient.invalidateQueries({ queryKey: getFeedGetBookmarksQueryKey() });
}

async function handleDelete(id: string) {
  allPosts = allPosts.filter((p) => String(p.id) !== id);
  await postsDelete(id);
  queryClient.invalidateQueries({ queryKey: getFeedGetBookmarksQueryKey() });
}

async function handleRepost(id: string) {
  await engagementRepost(id);
  queryClient.invalidateQueries({ queryKey: getFeedGetBookmarksQueryKey() });
}

async function handleReport(id: string) {
  await engagementReport(id);
}
</script>

<svelte:head>
	<title>Bookmarks</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-400 dark:text-neutral-500" />
	</div>
{:else if authenticated}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto max-w-2xl px-4">
			<div class="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="xs" onclick={() => goto('/feed')}>
					<ArrowLeft size={16} />
				</Button>
				<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Bookmarks</h1>
			</div>

			<div class="space-y-4">
				{#each allPosts as post (String(post.id))}
					<PostCard
						post={{
							...post,
							isLiked: isPostLiked(post),
							isBookmarked: isPostBookmarked(post)
						}}
						{currentUserId}
						onlike={handleLike}
						onunlike={handleUnlike}
						onbookmark={handleBookmark}
						onunbookmark={handleUnbookmark}
						ondelete={handleDelete}
						onrepost={handleRepost}
						onreport={handleReport}
					/>
				{/each}
			</div>

			{#if bookmarksQuery.isLoading && allPosts.length === 0}
				<div class="flex justify-center py-12">
					<Loader2 size={24} class="animate-spin text-gray-400 dark:text-neutral-500" />
				</div>
			{:else if allPosts.length === 0 && !bookmarksQuery.isLoading}
				<div class="py-12 text-center">
					<p class="text-sm text-gray-400 dark:text-neutral-500">No bookmarks yet.</p>
				</div>
			{/if}

			{#if hasMore && allPosts.length > 0}
				<div bind:this={sentinelEl} class="flex justify-center py-8">
					{#if loadingMore}
						<Loader2 size={20} class="animate-spin text-gray-400 dark:text-neutral-500" />
					{/if}
				</div>
			{/if}
		</main>
	</div>
{/if}
