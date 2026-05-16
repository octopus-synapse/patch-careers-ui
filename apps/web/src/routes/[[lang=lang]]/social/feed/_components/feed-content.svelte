<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1Feed,
  createGetV1UsersMeConnectionsSuggestions,
  getV1FeedQueryKey,
} from 'api-client';
import { Plus } from 'lucide-svelte';
import { useAuth } from '$lib/state/auth.svelte';
import CreatePostModal from './create-post-modal.svelte';
import FeedHeader from './feed-header.svelte';
import FeedList from './feed-list.svelte';
import FeedQuickNav from './feed-quick-nav.svelte';
import NewPostsPill from './new-posts-pill.svelte';
import type { PostFitScore } from './post-card.svelte';
import ReportModal from './report-modal.svelte';
import RepostModal from './repost-modal.svelte';
import { locale } from '$lib/state/locale.svelte';
import { useFeedEngagement } from '$lib/state/use-feed-engagement.svelte';
import { useFeedPagination } from '$lib/state/use-feed-pagination.svelte';
import { useUserSkills } from '$lib/state/use-user-skills.svelte';

const t = $derived(locale.t);

// Feed mode is driven by the parent route (/social/feed vs /social/feed/bubble).
let { followingOnly = false }: { followingOnly?: boolean } = $props();

const session = useAuth();
const user = $derived(session.user);
const currentUserId = $derived(String(user?.id ?? ''));
const userName = $derived(String(user?.name ?? ''));
const userPhoto: string | null = null;

let showCreateModal = $state(false);
let showReportModal = $state(false);
let reportPostId = $state<string | null>(null);
let showRepostModal = $state(false);
let repostTargetPost = $state<Record<string, unknown> | null>(null);

const queryClient = useQueryClient();

const suggestionsQuery = createGetV1UsersMeConnectionsSuggestions({ limit: 20 });

const feedSuggestions = $derived($suggestionsQuery.data?.items ?? []);

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

// svelte-ignore state_referenced_locally
const feedQuery = createGetV1Feed(
  {
    cursor: pagination.cursor,
    limit: 20,
    ...(followingOnly ? { followingOnly: 'true' } : {}),
  },
  {
    query: {
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

<div class="min-h-screen bg-zinc-50 pb-16 dark:bg-zinc-950">
	<div class="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-10">
		<div class="lg:col-span-3">
			<FeedQuickNav />
		</div>

		<main class="space-y-5 lg:col-span-9">
			<FeedHeader
				{userName}
				{userPhoto}
				oncreate={() => (showCreateModal = true)}
			/>

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
</div>

<button
	type="button"
	aria-label={t('feed.mobileCompose')}
	onclick={() => (showCreateModal = true)}
	class="btn-glossy fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-blue-600/40 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 lg:hidden"
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
