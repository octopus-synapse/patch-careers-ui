<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createConnectionGetConnectionSuggestions,
  createFeedGetTimeline,
  engagementBookmark,
  engagementLike,
  engagementReport,
  engagementRepost,
  engagementUnbookmark,
  engagementUnlike,
  engagementVote,
  getFeedGetTimelineQueryKey,
  isApiError,
  postsDelete,
} from 'api-client';
import { AlertCircle, ArrowUp, Bookmark, PenSquare } from 'lucide-svelte';
import type { Component } from 'svelte';
import { cubicOut } from 'svelte/easing';
import { fly } from 'svelte/transition';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  type ReactionType,
  Tabs,
  ToastContainer,
  toastState,
} from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { track } from '$lib/analytics/track';
import { useAuth } from '$lib/auth.svelte';
import ActivityStream from '$lib/components/feed/activity-stream.svelte';
import CreatePostModal from '$lib/components/feed/create-post-modal.svelte';
import PostCard from '$lib/components/feed/post-card.svelte';
import PostSkeleton from '$lib/components/feed/post-skeleton.svelte';
import ReportModal from '$lib/components/feed/report-modal.svelte';
import RepostModal from '$lib/components/feed/repost-modal.svelte';
import SuggestionsCarousel from '$lib/components/mynetwork/suggestions-carousel.svelte';
import { locale } from '$lib/locale.svelte';

const t = $derived(locale.t);

// Auth check
const session = useAuth();
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);
const currentUserId = $derived(String(user?.id ?? ''));
const userName = $derived(String(user?.name ?? ''));
const userPhoto = $derived(((user as Record<string, unknown>)?.photoURL as string | null) ?? null);

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/login');
  }
});

// Filters — i18n labels
const filterOptions = $derived([
  { value: 'ALL', label: locale.t('feed.tabsAll') },
  { value: 'ACHIEVEMENT', label: locale.t('feed.postTypes.ACHIEVEMENT') },
  { value: 'OPPORTUNITY', label: locale.t('feed.postTypes.OPPORTUNITY') },
  { value: 'LEARNING', label: locale.t('feed.postTypes.LEARNING') },
  { value: 'BUILD', label: locale.t('feed.postTypes.BUILD') },
  { value: 'QUESTION', label: locale.t('feed.postTypes.QUESTION') },
  { value: 'CHALLENGE', label: locale.t('feed.postTypes.CHALLENGE') },
]);
let selectedFilter = $state('ALL');
let feedSource = $state<'posts' | 'activity'>('posts');
const feedSourceTabs = $derived([
  { value: 'posts', label: locale.t('feed.tabsPosts') },
  { value: 'activity', label: locale.t('feed.tabsActivity') },
]);

// Cursor-based pagination
let cursor = $state<string | undefined>(undefined);
let allPosts = $state<Record<string, unknown>[]>([]);
let hasMore = $state(true);
let loadingMore = $state(false);

// Buffer of posts detected at the top of the feed via polling
let newPostsBuffer = $state<Record<string, unknown>[]>([]);

// Local engagement state overrides
let likedPosts = $state<Set<string>>(new Set());
let unlikedPosts = $state<Set<string>>(new Set());
let bookmarkedPosts = $state<Set<string>>(new Set());
let unbookmarkedPosts = $state<Set<string>>(new Set());

// Create post modal
let showCreateModal = $state(false);

// Report modal
let showReportModal = $state(false);
let reportPostId = $state<string | null>(null);

// Repost modal
let showRepostModal = $state(false);
let repostTargetPost = $state<Record<string, unknown> | null>(null);

const queryClient = useQueryClient();

const suggestionsQuery = createConnectionGetConnectionSuggestions(
  () => ({ page: 1, limit: 20 }),
  () => ({ query: { enabled: browser && authenticated } }),
);

type SuggestionItem = {
  id: string;
  name?: string | null;
  username?: string | null;
  photoURL?: string | null;
  reason?: string | null;
};

const feedSuggestions = $derived.by<SuggestionItem[]>(() => {
  const outer = suggestionsQuery.data as Record<string, unknown> | undefined;
  const section = outer?.suggestions as Record<string, unknown> | undefined;
  const items = (section?.data as SuggestionItem[] | undefined) ?? [];
  return items;
});

const feedQuery = createFeedGetTimeline(
  () => ({
    cursor,
    limit: 20,
    type: selectedFilter === 'ALL' ? undefined : selectedFilter,
  }),
  () => ({
    query: {
      enabled: authenticated,
      // Only poll when the user is at the head of the feed — further
      // pages are stable and shouldn't be refetched in the background.
      refetchInterval: cursor === undefined ? 60_000 : false,
    },
  }),
);

const rawData = $derived(feedQuery.data);

// When data arrives, append to allPosts
$effect(() => {
  if (!rawData) return;
  const postsArr = (Array.isArray(rawData) ? rawData : rawData?.posts) as
    | Record<string, unknown>[]
    | undefined;
  if (!postsArr) return;

  const nextCursor = rawData?.nextCursor;

  if (cursor === undefined) {
    if (allPosts.length === 0) {
      // First page or filter change
      allPosts = postsArr;
      newPostsBuffer = [];
    } else {
      // Background refetch at head: detect new items without
      // disrupting the user's scroll position.
      const currentTopId = String(allPosts[0].id);
      const newTopIndex = postsArr.findIndex((p) => String(p.id) === currentTopId);
      if (newTopIndex > 0) {
        newPostsBuffer = postsArr.slice(0, newTopIndex);
      } else if (newTopIndex === -1) {
        newPostsBuffer = postsArr;
      }
    }
  } else {
    // Appending
    const existingIds = new Set(allPosts.map((p) => String(p.id)));
    const newPosts = postsArr.filter((p) => !existingIds.has(String(p.id)));
    if (newPosts.length > 0) {
      allPosts = [...allPosts, ...newPosts];
    }
  }

  hasMore = !!nextCursor && postsArr.length > 0;
  loadingMore = false;
});

function applyNewPosts() {
  if (newPostsBuffer.length === 0) return;
  const existingIds = new Set(allPosts.map((p) => String(p.id)));
  const fresh = newPostsBuffer.filter((p) => !existingIds.has(String(p.id)));
  allPosts = [...fresh, ...allPosts];
  newPostsBuffer = [];
  if (browser) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Reset when filter changes
$effect(() => {
  // Track selectedFilter
  selectedFilter;
  cursor = undefined;
  allPosts = [];
  newPostsBuffer = [];
  hasMore = true;
  likedPosts = new Set();
  unlikedPosts = new Set();
  bookmarkedPosts = new Set();
  unbookmarkedPosts = new Set();
});

// Intersection observer for infinite scroll
let sentinelEl: HTMLDivElement | undefined = $state();

$effect(() => {
  if (!sentinelEl || !browser) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !feedQuery.isLoading && !loadingMore) {
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
  return Boolean(post.isBookmarked ?? post.bookmarked ?? false);
}

async function handleLike(id: string, reactionType?: ReactionType) {
  const newType: ReactionType = reactionType ?? 'LIKE';
  const snapshotPosts = allPosts;
  const snapshotLiked = likedPosts;
  const snapshotUnliked = unlikedPosts;
  const target = allPosts.find((p) => String(p.id) === id);
  const wasLiked = Boolean(target?.isLiked ?? target?.liked);
  const previousType = (target?.reactionType as ReactionType | null | undefined) ?? null;

  likedPosts = new Set([...likedPosts, id]);
  unlikedPosts = new Set([...unlikedPosts].filter((x) => x !== id));
  allPosts = allPosts.map((p) => {
    if (String(p.id) !== id) return p;
    const prevCount = Number(p.likesCount ?? p.likeCount ?? 0);
    return {
      ...p,
      isLiked: true,
      reactionType: newType,
      likesCount: wasLiked ? prevCount : prevCount + 1,
      likeCount: wasLiked ? prevCount : prevCount + 1,
    };
  });

  try {
    await engagementLike(id, {
      body: JSON.stringify({ reactionType: newType }),
      headers: { 'Content-Type': 'application/json' },
    });
    track(wasLiked ? 'post_reaction_changed' : 'post_reacted', {
      postId: id,
      reactionType: newType,
      previousType,
    });
    queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
  } catch {
    allPosts = snapshotPosts;
    likedPosts = snapshotLiked;
    unlikedPosts = snapshotUnliked;
    toastState.show(locale.t('feed.reactions.errorGeneric'), 'danger');
  }
}

async function handleUnlike(id: string) {
  const snapshotPosts = allPosts;
  const snapshotLiked = likedPosts;
  const snapshotUnliked = unlikedPosts;

  unlikedPosts = new Set([...unlikedPosts, id]);
  likedPosts = new Set([...likedPosts].filter((x) => x !== id));
  allPosts = allPosts.map((p) => {
    if (String(p.id) !== id) return p;
    const prevCount = Number(p.likesCount ?? p.likeCount ?? 0);
    return {
      ...p,
      isLiked: false,
      reactionType: null,
      likesCount: Math.max(0, prevCount - 1),
      likeCount: Math.max(0, prevCount - 1),
    };
  });

  try {
    await engagementUnlike(id);
    track('post_unreacted', { postId: id });
    queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
  } catch {
    allPosts = snapshotPosts;
    likedPosts = snapshotLiked;
    unlikedPosts = snapshotUnliked;
    toastState.show(locale.t('feed.reactions.errorGeneric'), 'danger');
  }
}

async function handleBookmark(id: string) {
  bookmarkedPosts = new Set([...bookmarkedPosts, id]);
  unbookmarkedPosts = new Set([...unbookmarkedPosts].filter((x) => x !== id));
  allPosts = allPosts.map((p) => {
    if (String(p.id) === id) return { ...p, isBookmarked: true };
    return p;
  });
  await engagementBookmark(id);
  queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
}

async function handleUnbookmark(id: string) {
  unbookmarkedPosts = new Set([...unbookmarkedPosts, id]);
  bookmarkedPosts = new Set([...bookmarkedPosts].filter((x) => x !== id));
  allPosts = allPosts.map((p) => {
    if (String(p.id) === id) return { ...p, isBookmarked: false };
    return p;
  });
  await engagementUnbookmark(id);
  queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
}

// Pending deletes: id → { timer, snapshot, undone } so the user can undo
// within a 5s window before the API call actually fires.
const pendingDeletes = new Map<
  string,
  { timer: ReturnType<typeof setTimeout>; snapshot: Record<string, unknown>[]; undone: boolean }
>();

function handleDelete(id: string) {
  // ConfirmModal already confirmed in post-card; proceed with optimistic delete.
  const snapshot = allPosts;
  allPosts = allPosts.filter((p) => String(p.id) !== id);

  const timer = setTimeout(async () => {
    const entry = pendingDeletes.get(id);
    pendingDeletes.delete(id);
    if (!entry || entry.undone) return;
    try {
      await postsDelete(id);
      queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
    } catch {
      allPosts = entry.snapshot;
      toastState.show(t('feed.deleteFailed'), 'danger');
    }
  }, 5000);

  pendingDeletes.set(id, { timer, snapshot, undone: false });

  toastState.show(t('feed.postDeleted'), 'info', {
    duration: 5000,
    action: {
      label: t('feed.undo'),
      onClick: () => {
        const entry = pendingDeletes.get(id);
        if (!entry) return;
        clearTimeout(entry.timer);
        entry.undone = true;
        pendingDeletes.delete(id);
        allPosts = entry.snapshot;
      },
    },
  });
}

function handleRepost(id: string) {
  const post = allPosts.find((p) => String(p.id) === id);
  if (post) {
    repostTargetPost = post;
    showRepostModal = true;
  }
}

async function handleRepostSubmit(content: string) {
  if (!repostTargetPost) return;
  const id = String(repostTargetPost.id);
  showRepostModal = false;
  repostTargetPost = null;
  const commentary = content.trim();
  const snapshot = allPosts;
  allPosts = allPosts.map((p) => {
    if (String(p.id) !== id) return p;
    return {
      ...p,
      isReposted: true,
      repostsCount: Number(p.repostsCount ?? p.repostCount ?? 0) + 1,
    };
  });
  try {
    if (commentary) {
      await engagementRepost(id, {
        body: JSON.stringify({ commentary }),
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      await engagementRepost(id);
    }
    track('post_reposted', { postId: id, withCommentary: commentary.length > 0 });
    queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
  } catch (err) {
    allPosts = snapshot;
    const message =
      isApiError(err) && err.statusCode === 409
        ? locale.t('feed.quoteRepost.alreadyRepostedError')
        : locale.t('feed.quoteRepost.genericError');
    toastState.show(message, 'danger');
  }
}

function handleReport(id: string) {
  reportPostId = id;
  showReportModal = true;
}

async function handleReportSubmit(reason: string) {
  if (!reportPostId) return;
  showReportModal = false;
  await engagementReport(reportPostId, {
    body: JSON.stringify({ reason }),
    headers: { 'Content-Type': 'application/json' },
  });
  reportPostId = null;
}

let votingPosts = $state<Set<string>>(new Set());

async function handleVote(id: string, optionIndex: number) {
  if (votingPosts.has(id)) return;
  const t = locale.t;
  const snapshot = allPosts;
  votingPosts = new Set([...votingPosts, id]);
  allPosts = allPosts.map((p) => {
    if (String(p.id) !== id) return p;
    const data = (p.data ?? {}) as Record<string, unknown>;
    const options = Array.isArray(data.options) ? [...data.options] : [];
    const current = options[optionIndex] as { votes?: number } | undefined;
    if (current) {
      options[optionIndex] = { ...current, votes: Number(current.votes ?? 0) + 1 };
    }
    return {
      ...p,
      hasVoted: true,
      myVoteIndex: optionIndex,
      votesCount: Number(p.votesCount ?? 0) + 1,
      data: { ...data, options },
    };
  });
  try {
    await engagementVote(id, {
      body: JSON.stringify({ optionIndex }),
      headers: { 'Content-Type': 'application/json' },
    });
    track('poll_voted', { postId: id, optionIndex });
    queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
  } catch (err) {
    allPosts = snapshot;
    const message =
      isApiError(err) && err.statusCode === 409
        ? t('feed.poll.alreadyVotedError')
        : t('feed.poll.voteError');
    toastState.show(message, 'danger');
  } finally {
    votingPosts = new Set([...votingPosts].filter((x) => x !== id));
  }
}

function handlePostCreated() {
  showCreateModal = false;
  cursor = undefined;
  allPosts = [];
  queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
}

function handleFilterChange(value: string, el?: HTMLElement) {
  selectedFilter = value;
  if (el && browser) {
    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
}
</script>

<svelte:head>
	<title>{t('feed.pageTitle')}</title>
</svelte:head>

{#if session.isLoading}
	<!-- Skeleton loading for auth check -->
	<div class="flex min-h-screen items-center justify-center pt-14">
		<div class="mx-auto w-full max-w-2xl px-4">
			<PostSkeleton count={3} />
		</div>
	</div>
{:else if authenticated}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto max-w-2xl px-4">
			<!-- Trigger bar -->
			<Card class="shadow-sm hover:shadow-md transition-shadow">
				<div class="flex items-center gap-2">
					<button
						class="flex flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:opacity-80"
						onclick={() => showCreateModal = true}
					>
						<Avatar name={userName || 'U'} photoURL={userPhoto} size="md" />
						<span class="flex-1 text-left text-sm text-gray-400 dark:text-neutral-500">{t('feed.whatsOnYourMind')}</span>
						<PenSquare size={18} class="text-gray-400 dark:text-neutral-500" />
					</button>
					<Button variant="ghost" size="sm" onclick={() => goto('/feed/bookmarks')}>
						<Bookmark size={18} />
						<span class="text-xs">{t('feed.saved')}</span>
					</Button>
				</div>
			</Card>

			<!-- Feed source tabs (Posts vs Activity stream) -->
			<div class="mt-4">
				<Tabs
					tabs={feedSourceTabs}
					selected={feedSource}
					onchange={(v) => (feedSource = v as 'posts' | 'activity')}
				/>
			</div>

			{#if feedSource === 'posts'}
				<!-- Filters — horizontal scrollable pills with right-edge fade -->
				<div class="mt-4 filter-strip">
					<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
						{#each filterOptions as option}
							<button
								class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors {selectedFilter === option.value ? 'bg-gray-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}"
								onclick={(e) => handleFilterChange(option.value, e.currentTarget as HTMLElement)}
							>
								{option.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if feedSource === 'activity'}
				<div class="mt-6">
					<ActivityStream />
				</div>
			{:else}
			<!-- "N new posts" pill -->
			{#if newPostsBuffer.length > 0}
				<div class="sticky top-16 z-20 mt-4 flex justify-center" transition:fly={{ y: -8, duration: 180, easing: cubicOut }}>
					<button
						onclick={applyNewPosts}
						class="flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
					>
						<ArrowUp size={14} />
						{t('feed.newPosts', { count: newPostsBuffer.length })}
					</button>
				</div>
			{/if}

			<!-- Post list -->
			<div class="mt-6 space-y-4">
				{#each allPosts as post, i (String(post.id))}
					<div in:fly={{ y: 8, duration: 220, easing: cubicOut }}>
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
							onvote={handleVote}
						/>
					</div>
					{#if (i + 1) % 8 === 0 && feedSuggestions.length >= 3 && i < allPosts.length - 1}
						{@const block = Math.floor((i + 1) / 8) - 1}
						{@const chunkSize = 6}
						{@const start = (block * chunkSize) % Math.max(1, feedSuggestions.length)}
						{@const pool = feedSuggestions.concat(feedSuggestions)}
						{@const chunk = pool.slice(start, start + chunkSize)}
						{#if chunk.length > 0}
							<SuggestionsCarousel
								suggestions={chunk.map((s) => ({
									id: String(s.id ?? ''),
									name: s.name ?? null,
									username: s.username ?? null,
									photoURL: s.photoURL ?? null,
									reason: s.reason ?? null
								}))}
								seeAllHref="/mynetwork/suggestions"
								source="feed_inline"
							/>
						{/if}
					{/if}
				{/each}
			</div>

			<!-- Loading / error / empty -->
			{#if feedQuery.isLoading && allPosts.length === 0}
				<div class="mt-6">
					<PostSkeleton count={3} />
				</div>
			{:else if feedQuery.isError && allPosts.length === 0}
				<div class="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/10">
					<AlertCircle size={32} class="mx-auto mb-2 text-red-500" />
					<p class="text-sm text-gray-800 dark:text-neutral-200">{t('feed.errorLoading')}</p>
					<Button variant="ghost" size="sm" class="mt-3" onclick={() => feedQuery.refetch()}>
						{t('feed.retry')}
					</Button>
				</div>
			{:else if allPosts.length === 0 && !feedQuery.isLoading}
				<div class="py-12">
					<EmptyState message={t('feed.noPost')} icon={PenSquare as unknown as Component<{ size: number; class?: string }>} />
				</div>
			{/if}

			<!-- Infinite scroll sentinel -->
			{#if hasMore && allPosts.length > 0}
				<div bind:this={sentinelEl} class="flex justify-center py-8" aria-live="polite" aria-busy={loadingMore}>
					{#if loadingMore}
						<div class="flex gap-2" role="status">
							<span class="sr-only">{t('feed.loadingMore')}</span>
							{#each [0, 1, 2] as step}
								<div
									class="h-2 w-2 animate-bounce rounded-full bg-gray-300 dark:bg-neutral-600"
									style="animation-delay: {step * 150}ms"
								></div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
			{/if}
		</main>
	</div>

	<!-- Create post modal -->
	<CreatePostModal
		open={showCreateModal}
		oncreate={handlePostCreated}
		oncancel={() => showCreateModal = false}
	/>

	<!-- Report modal -->
	<ReportModal
		open={showReportModal}
		onsubmit={handleReportSubmit}
		oncancel={() => { showReportModal = false; reportPostId = null; }}
	/>

	<!-- Repost modal -->
	<RepostModal
		open={showRepostModal}
		post={repostTargetPost}
		onsubmit={handleRepostSubmit}
		oncancel={() => { showRepostModal = false; repostTargetPost = null; }}
	/>

	<ToastContainer />
{/if}

<style>
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	/* Fade out the right edge of the filter strip as a visual cue that more
	   filters are scrollable offscreen. Uses mask-image so it plays nicely
	   with horizontal scroll and dark mode (fades to transparent, not to a
	   specific background color). */
	.filter-strip {
		-webkit-mask-image: linear-gradient(to right, black calc(100% - 2.5rem), transparent);
		mask-image: linear-gradient(to right, black calc(100% - 2.5rem), transparent);
	}
</style>
