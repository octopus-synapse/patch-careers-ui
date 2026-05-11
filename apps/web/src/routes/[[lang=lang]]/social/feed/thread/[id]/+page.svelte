<script lang="ts">
import {
  createGetV1PostsId,
  deleteV1PostsIdBookmarkMutationKey,
  postV1PostsIdBookmark,
  deleteV1PostsIdLikeMutationKey,
  postV1PostsIdLike,
  postV1PostsIdReport,
  postV1PostsIdRepost,
  deleteV1PostsId,
  deleteV1PostsIdLike,
  deleteV1PostsIdBookmark,
} from 'api-client';
import type { GetV1PostsId200 } from 'api-client';
import { ArrowLeft } from 'lucide-svelte';
import { Button, Loader } from 'ui';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import PostCard from '../../_components/post-card.svelte';
import { useAuth } from '$lib/state/auth.svelte';

/**
 * Thread page — frontend BURRO. Reads `GET /api/v1/posts/:id` and renders
 * the post through the shared `PostCard`. Engagement
 * (like/bookmark/repost/report/delete) is wired through the canonical
 * engagement endpoints; optimistic state lives in local `Set`s because
 * this view only ever shows one thread at a time.
 */

const session = useAuth();
const user = $derived(session.user);
const authenticated = $derived(session.isAuthenticated);
const currentUserId = $derived(String(user?.id ?? ''));

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

const threadId = $derived($page.params.id ?? '');

const postQuery = createGetV1PostsId(
  threadId,
  { query: { enabled: () => authenticated && !!threadId } },
);

const threadPost = $derived($postQuery.data);

let likedPosts = $state<Set<string>>(new Set());
let unlikedPosts = $state<Set<string>>(new Set());
let bookmarkedPosts = $state<Set<string>>(new Set());
let unbookmarkedPosts = $state<Set<string>>(new Set());

function isPostLiked(post: GetV1PostsId200): boolean {
  const id = post.id;
  if (likedPosts.has(id)) return true;
  if (unlikedPosts.has(id)) return false;
  return false;
}

function isPostBookmarked(post: GetV1PostsId200): boolean {
  const id = post.id;
  if (bookmarkedPosts.has(id)) return true;
  if (unbookmarkedPosts.has(id)) return false;
  return false;
}

async function handleLike(id: string) {
  likedPosts = new Set([...likedPosts, id]);
  unlikedPosts = new Set([...unlikedPosts].filter((x) => x !== id));
  await postV1PostsIdLike(id, { reactionType: 'LIKE' });
}

async function handleUnlike(id: string) {
  unlikedPosts = new Set([...unlikedPosts, id]);
  likedPosts = new Set([...likedPosts].filter((x) => x !== id));
  await deleteV1PostsIdLike(id);
}

async function handleBookmark(id: string) {
  bookmarkedPosts = new Set([...bookmarkedPosts, id]);
  unbookmarkedPosts = new Set([...unbookmarkedPosts].filter((x) => x !== id));
  await postV1PostsIdBookmark(id);
}

async function handleUnbookmark(id: string) {
  unbookmarkedPosts = new Set([...unbookmarkedPosts, id]);
  bookmarkedPosts = new Set([...bookmarkedPosts].filter((x) => x !== id));
  await deleteV1PostsIdBookmark(id);
}

async function handleDelete(id: string) {
  await deleteV1PostsId(id);
  goto('/social/feed');
}

async function handleRepost(id: string) {
  await postV1PostsIdRepost(id, {});
}

async function handleReport(id: string) {
  await postV1PostsIdReport(id, { reason: 'unspecified' });
}
</script>

<svelte:head>
	<title>Thread</title>
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
				<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">Thread</h1>
			</div>

			{#if $postQuery.isLoading}
				<div class="flex justify-center py-12">
					<Loader size={24} />
				</div>
			{:else if threadPost}
				<div class="space-y-1">
					<PostCard
						post={{
							...threadPost,
							isLiked: isPostLiked(threadPost),
							isBookmarked: isPostBookmarked(threadPost),
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
				</div>
			{:else}
				<div class="py-12 text-center">
					<p class="text-sm text-gray-400 dark:text-neutral-500">Thread not found.</p>
				</div>
			{/if}
		</main>
	</div>
{/if}
