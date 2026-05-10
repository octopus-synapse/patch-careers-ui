<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1Feed,
  createGetV1UsersMeConnectionsSuggestions,
  getV1FeedQueryKey,
} from 'api-client';
import { Plus } from 'lucide-svelte';
import { Tabs, ToastContainer } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import CreatePostModal from './_components/create-post-modal.svelte';
import FeedHeader from './_components/feed-header.svelte';
import FeedList from './_components/feed-list.svelte';
import NewPostsPill from './_components/new-posts-pill.svelte';
import type { PostFitScore } from './_components/post-card.svelte';
import PostSkeleton from './_components/post-skeleton.svelte';
import ReportModal from './_components/report-modal.svelte';
import RepostModal from './_components/repost-modal.svelte';
import { locale } from '$lib/state/locale.svelte';
import { useFeedEngagement } from '$lib/state/use-feed-engagement.svelte';
import { useFeedPagination } from '$lib/state/use-feed-pagination.svelte';
import { useUserSkills } from '$lib/state/use-user-skills.svelte';

const t = $derived(locale.t);

// Auth
const session = useAuth();
const user = $derived(session.user);
const authenticated = $derived(session.isAuthenticated);
const currentUserId = $derived(String(user?.id ?? ''));
const userName = $derived(String(user?.name ?? ''));
const userPhoto: string | null = null;

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

// The only "filter" on the feed is a two-tab toggle that reveals on
// scroll: "Explorar" (default, no server-side filter) vs "Minha bolha"
// (`followingOnly=true`).
type FeedTab = 'explore' | 'bubble';
let activeTab = $state<FeedTab>('explore');
const feedTabs: { value: FeedTab; label: string }[] = [
  { value: 'explore', label: 'Explorar' },
  { value: 'bubble', label: 'Minha bolha' },
];
let composerSentinel = $state<HTMLDivElement | null>(null);
let tabsStuck = $state(false);

$effect(() => {
  if (!browser || !composerSentinel) return;
  const obs = new IntersectionObserver(
    ([entry]) => {
      tabsStuck = !entry.isIntersecting;
    },
    { threshold: 0 },
  );
  obs.observe(composerSentinel);
  return () => obs.disconnect();
});

function handleTabChange(value: string) {
  const next = value as FeedTab;
  if (next === activeTab) return;
  activeTab = next;
  pagination.reset();
  queryClient.invalidateQueries({ queryKey: getV1FeedQueryKey() });
}

// Modals
let showCreateModal = $state(false);
let showReportModal = $state(false);
let reportPostId = $state<string | null>(null);
let showRepostModal = $state(false);
let repostTargetPost = $state<Record<string, unknown> | null>(null);

const queryClient = useQueryClient();

const suggestionsQuery = createGetV1UsersMeConnectionsSuggestions(
  { limit: 20 },
  { query: { enabled: browser && authenticated } },
);

const feedSuggestions = $derived($suggestionsQuery.data?.items ?? []);

// SDK envelope is `{posts, nextCursor}`; pagination util keys the array as
// `items`, so we adapt at the boundary.
const pagination = useFeedPagination({
  getRawData: () => {
    const data = $feedQuery.data;
    if (!data) return undefined;
    return { items: data.items, nextCursor: data.nextCursor };
  },
});

const engagement = useFeedEngagement({
  getPosts: () => pagination.allPosts,
  setPosts: (posts) => {
    pagination.allPosts = posts;
  },
});

const userSkills = useUserSkills();

// Compute fit score for OPPORTUNITY posts by overlapping the post's
// hardSkills with the user's skills. Empty / missing on either side
// yields no chip (handled in PostCard via null fitScore).
const fitScoreByPostId = $derived.by<Record<string, PostFitScore>>(() => {
  const map: Record<string, PostFitScore> = {};
  if (userSkills.skills.size === 0) return map;
  for (const post of pagination.allPosts) {
    if (post.type !== 'OPPORTUNITY') continue;
    const postSkills = (post.hardSkills as string[] | undefined) ?? [];
    if (postSkills.length === 0) continue;
    const matched: string[] = [];
    const missing: string[] = [];
    for (const skill of postSkills) {
      if (userSkills.skills.has(skill.toLowerCase())) matched.push(skill);
      else missing.push(skill);
    }
    const score = Math.round((matched.length / postSkills.length) * 100);
    map[String(post.id)] = {
      score,
      breakdown: { matchedSkills: matched, missingSkills: missing },
    };
  }
  return map;
});

const feedQuery = createGetV1Feed(
  {
    cursor: pagination.cursor,
    limit: 20,
    ...(activeTab === 'bubble' ? { followingOnly: 'true' } : {}),
  },
  {
        query: {
          enabled: authenticated,
          // Only poll when the user is at the head of the feed — further
          // pages are stable and shouldn't be refetched in the background.
          refetchInterval: pagination.cursor === undefined ? 60_000 : false,
        },
      },
);

function handleRepost(id: string) {
  const post = pagination.allPosts.find((p) => String(p.id) === id);
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
  await engagement.submitRepost(id, content.trim());
}

function handleReport(id: string) {
  reportPostId = id;
  showReportModal = true;
}

async function handleReportSubmit(reason: string) {
  if (!reportPostId) return;
  showReportModal = false;
  await engagement.submitReport(reportPostId, reason);
  reportPostId = null;
}

function handlePostCreated() {
  showCreateModal = false;
  pagination.reset();
  queryClient.invalidateQueries({ queryKey: getV1FeedQueryKey() });
}
</script>

<svelte:head>
	<title>{t('feed.pageTitle')}</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<div class="mx-auto w-full max-w-2xl px-4">
			<PostSkeleton count={3} />
		</div>
	</div>
{:else if authenticated}
	{#if tabsStuck}
		<div
			data-testid="feed-reveal-tabs"
			class="fixed inset-x-0 top-14 z-20 w-full bg-white/60 backdrop-blur-md [&_[role=tablist]]:justify-center [&_[role=tablist]]:border-b-0 dark:bg-neutral-900/60"
		>
			<Tabs tabs={feedTabs} selected={activeTab} onchange={handleTabChange} />
		</div>
	{/if}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto w-full max-w-2xl px-4">
			<FeedHeader
				{userName}
				{userPhoto}
				oncreate={() => (showCreateModal = true)}
			/>

			<div bind:this={composerSentinel} aria-hidden="true" class="h-px w-full"></div>

			<NewPostsPill count={pagination.newPostsBuffer.length} onclick={pagination.applyNewPosts} />

			<FeedList
				posts={pagination.allPosts}
				{currentUserId}
				suggestions={feedSuggestions}
				isLoading={$feedQuery.isLoading}
				isError={$feedQuery.isError}
				hasMore={pagination.hasMore}
				loadingMore={pagination.loadingMore}
				{fitScoreByPostId}
				isPostLiked={engagement.isPostLiked}
				isPostBookmarked={engagement.isPostBookmarked}
				onlike={engagement.handleLike}
				onunlike={engagement.handleUnlike}
				onbookmark={engagement.handleBookmark}
				onunbookmark={engagement.handleUnbookmark}
				ondelete={engagement.handleDelete}
				onrepost={handleRepost}
				onreport={handleReport}
				onvote={engagement.handleVote}
				onretry={() => $feedQuery.refetch()}
				onloadmore={pagination.loadNextPage}
			/>
		</main>
	</div>

	<button
		type="button"
		aria-label={t('feed.whatsOnYourMind')}
		onclick={() => (showCreateModal = true)}
		class="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 lg:hidden dark:bg-cyan-500 dark:hover:bg-cyan-400"
	>
		<Plus size={24} />
	</button>

	<CreatePostModal
		open={showCreateModal}
		oncreate={handlePostCreated}
		oncancel={() => (showCreateModal = false)}
	/>

	<ReportModal
		open={showReportModal}
		onsubmit={handleReportSubmit}
		oncancel={() => {
			showReportModal = false;
			reportPostId = null;
		}}
	/>

	<RepostModal
		open={showRepostModal}
		post={repostTargetPost}
		onsubmit={handleRepostSubmit}
		oncancel={() => {
			showRepostModal = false;
			repostTargetPost = null;
		}}
	/>

	<ToastContainer />
{/if}
