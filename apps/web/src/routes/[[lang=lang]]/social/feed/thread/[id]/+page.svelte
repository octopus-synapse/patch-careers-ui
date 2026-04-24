<script lang="ts">
import {
  createAuthSession,
  createPostsFindById,
  engagementBookmark,
  engagementLike,
  engagementReport,
  engagementRepost,
  engagementUnbookmark,
  engagementUnlike,
  postsDelete,
} from 'api-client';
import { ArrowLeft, Loader2 } from 'lucide-svelte';
import { Button } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import PostCard from '../../_components/post-card.svelte';

const session = createAuthSession(() => ({
  query: { retry: false, enabled: browser },
}));
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);
const currentUserId = $derived(String(user?.id ?? ''));

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

const threadId = $derived($page.params.id ?? '');

const postQuery = createPostsFindById(
  () => threadId,
  () => ({
    query: { enabled: authenticated && !!threadId },
  }),
);

const postData = $derived(postQuery.data);

// Collect thread posts: main post + its thread children
const threadPosts = $derived.by(() => {
  if (!postData) return [];
  const mainPost = postData as unknown as Record<string, unknown>;
  const post = mainPost.post ? mainPost.post : mainPost;
  const postRecord = post as Record<string, unknown>;
  const threadChildren = postRecord.threadChildren;
  if (threadChildren && Array.isArray(threadChildren)) {
    return [postRecord, ...threadChildren];
  }
  return [postRecord];
});

let likedPosts = $state<Set<string>>(new Set());
let unlikedPosts = $state<Set<string>>(new Set());
let bookmarkedPosts = $state<Set<string>>(new Set());
let unbookmarkedPosts = $state<Set<string>>(new Set());

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
  return Boolean(post.isBookmarked ?? post.bookmarked ?? false);
}

async function handleLike(id: string) {
  likedPosts = new Set([...likedPosts, id]);
  unlikedPosts = new Set([...unlikedPosts].filter((x) => x !== id));
  await engagementLike(id);
}

async function handleUnlike(id: string) {
  unlikedPosts = new Set([...unlikedPosts, id]);
  likedPosts = new Set([...likedPosts].filter((x) => x !== id));
  await engagementUnlike(id);
}

async function handleBookmark(id: string) {
  bookmarkedPosts = new Set([...bookmarkedPosts, id]);
  unbookmarkedPosts = new Set([...unbookmarkedPosts].filter((x) => x !== id));
  await engagementBookmark(id);
}

async function handleUnbookmark(id: string) {
  unbookmarkedPosts = new Set([...unbookmarkedPosts, id]);
  bookmarkedPosts = new Set([...bookmarkedPosts].filter((x) => x !== id));
  await engagementUnbookmark(id);
}

async function handleDelete(id: string) {
  await postsDelete(id);
  goto('/social/feed');
}

async function handleRepost(id: string) {
  await engagementRepost(id);
}

async function handleReport(id: string) {
  await engagementReport(id);
}
</script>

<svelte:head>
	<title>Thread</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-400 dark:text-neutral-500" />
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
					<Loader2 size={24} class="animate-spin text-gray-400 dark:text-neutral-500" />
				</div>
			{:else}
				<div class="space-y-1">
					{#each threadPosts as post, i (String((post as Record<string, unknown>).id))}
						{@const postRec = post as Record<string, unknown>}
						<div class="relative">
							{#if i < threadPosts.length - 1}
								<div class="absolute left-7 top-14 bottom-0 w-0.5 bg-gray-200 dark:bg-neutral-700/50"></div>
							{/if}
							<PostCard
								post={{
									...postRec,
									isLiked: isPostLiked(postRec),
									isBookmarked: isPostBookmarked(postRec)
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
