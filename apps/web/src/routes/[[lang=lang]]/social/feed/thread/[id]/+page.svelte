<script lang="ts">
import {
  createPostsGetById,
  engagementPostsBookmarkDelete,
  engagementPostsBookmarkPost,
  engagementPostsLikeDelete,
  engagementPostsLikePost,
  engagementPostsReport,
  engagementPostsRepost,
  postsDelete,
} from 'api-client';
import { ArrowLeft } from 'lucide-svelte';
import { Button, Loader } from 'ui';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import PostCard from '../../_components/post-card.svelte';
import { useAuth } from '$lib/state/auth.svelte';

/**
 * Thread page — frontend BURRO. Reads `GET /api/v1/posts/:id` (which the
 * backend hydrates with `threadChildren` for thread-style posts) and
 * renders each entry through the shared `PostCard`. Engagement
 * (like/bookmark/repost/report/delete) is wired through the canonical
 * engagement endpoints; optimistic state lives in local `Set`s because
 * this view only ever shows one thread at a time.
 *
 * The swagger ships `void` schemas for these endpoints, so we cast to a
 * documented runtime shape at the boundary.
 */
type ThreadPost = Record<string, unknown>;

type ThreadResponse = {
  post?: ThreadPost & { threadChildren?: ThreadPost[] };
} & ThreadPost;

const session = useAuth();
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);
const currentUserId = $derived(String(user?.id ?? ''));

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

const threadId = $derived($page.params.id ?? '');

const postQuery = createPostsGetById(
  () => threadId,
  () => ({ query: { enabled: Boolean(authenticated) && !!threadId } }),
);

const threadPosts = $derived.by<ThreadPost[]>(() => {
  const raw = postQuery.data as unknown as ThreadResponse | undefined;
  if (!raw) return [];
  // Backend may wrap the post under a `post` field or expose it directly.
  const root = (raw.post ?? raw) as ThreadPost & { threadChildren?: ThreadPost[] };
  const children = Array.isArray(root.threadChildren) ? root.threadChildren : [];
  return [root, ...children];
});

let likedPosts = $state<Set<string>>(new Set());
let unlikedPosts = $state<Set<string>>(new Set());
let bookmarkedPosts = $state<Set<string>>(new Set());
let unbookmarkedPosts = $state<Set<string>>(new Set());

function isPostLiked(post: ThreadPost): boolean {
  const id = String(post.id);
  if (likedPosts.has(id)) return true;
  if (unlikedPosts.has(id)) return false;
  return Boolean(post.isLiked ?? post.liked ?? false);
}

function isPostBookmarked(post: ThreadPost): boolean {
  const id = String(post.id);
  if (bookmarkedPosts.has(id)) return true;
  if (unbookmarkedPosts.has(id)) return false;
  return Boolean(post.isBookmarked ?? post.bookmarked ?? false);
}

async function handleLike(id: string) {
  likedPosts = new Set([...likedPosts, id]);
  unlikedPosts = new Set([...unlikedPosts].filter((x) => x !== id));
  await engagementPostsLikePost(id, { reactionType: 'LIKE' });
}

async function handleUnlike(id: string) {
  unlikedPosts = new Set([...unlikedPosts, id]);
  likedPosts = new Set([...likedPosts].filter((x) => x !== id));
  await engagementPostsLikeDelete(id);
}

async function handleBookmark(id: string) {
  bookmarkedPosts = new Set([...bookmarkedPosts, id]);
  unbookmarkedPosts = new Set([...unbookmarkedPosts].filter((x) => x !== id));
  await engagementPostsBookmarkPost(id);
}

async function handleUnbookmark(id: string) {
  unbookmarkedPosts = new Set([...unbookmarkedPosts, id]);
  bookmarkedPosts = new Set([...bookmarkedPosts].filter((x) => x !== id));
  await engagementPostsBookmarkDelete(id);
}

async function handleDelete(id: string) {
  await postsDelete(id);
  goto('/social/feed');
}

async function handleRepost(id: string) {
  await engagementPostsRepost(id, {});
}

async function handleReport(id: string) {
  await engagementPostsReport(id, { reason: 'unspecified' });
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

			{#if postQuery.isLoading}
				<div class="flex justify-center py-12">
					<Loader size={24} />
				</div>
			{:else}
				<div class="space-y-1">
					{#each threadPosts as post, i (String(post.id))}
						<div class="relative">
							{#if i < threadPosts.length - 1}
								<div class="absolute left-7 top-14 bottom-0 w-0.5 bg-gray-200 dark:bg-neutral-700/50"></div>
							{/if}
							<PostCard
								post={{
									...post,
									isLiked: isPostLiked(post),
									isBookmarked: isPostBookmarked(post),
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
					{/each}
				</div>

				{#if threadPosts.length === 0}
					<div class="py-12 text-center">
						<p class="text-sm text-gray-400 dark:text-neutral-500">Thread not found.</p>
					</div>
				{/if}
			{/if}
		</main>
	</div>
{/if}
