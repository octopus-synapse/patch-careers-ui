<script lang="ts">
import { AlertCircle, PenSquare, SearchX } from 'lucide-svelte';
import { cubicOut } from 'svelte/easing';
import { fly } from 'svelte/transition';
import { Button, EmptyState } from 'ui';
import { browser } from '$app/environment';
import { asIcon } from '$lib/types/icons';
import { locale } from '$lib/state/locale.svelte';
import PostCard, { type PostFitScore } from './post-card.svelte';
import PostSkeleton from './post-skeleton.svelte';
import SuggestionsCarousel from '../../network/_components/suggestions-carousel.svelte';

type Post = Record<string, unknown>;

type SuggestionItem = {
  id: string;
  name?: string | null;
  username?: string | null;
  photoURL?: string | null;
  reason?: string | null;
};

type Props = {
  posts: Post[];
  currentUserId: string;
  suggestions: SuggestionItem[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  filterTerm?: string;
  fitScoreByPostId?: Record<string, PostFitScore>;
  isPostLiked: (post: Post) => boolean;
  isPostBookmarked: (post: Post) => boolean;
  onlike: (id: string) => void;
  onunlike: (id: string) => void;
  onbookmark: (id: string) => void;
  onunbookmark: (id: string) => void;
  ondelete: (id: string) => void;
  onrepost: (id: string) => void;
  onreport: (id: string) => void;
  onvote: (id: string, optionIndex: number) => void;
  onretry: () => void;
  onloadmore: () => void;
  onclearsearch?: () => void;
};

let {
  posts,
  currentUserId,
  suggestions,
  isLoading,
  isError,
  hasMore,
  loadingMore,
  filterTerm = '',
  fitScoreByPostId = {},
  isPostLiked,
  isPostBookmarked,
  onlike,
  onunlike,
  onbookmark,
  onunbookmark,
  ondelete,
  onrepost,
  onreport,
  onvote,
  onretry,
  onloadmore,
  onclearsearch,
}: Props = $props();

const t = $derived(locale.t);

const visiblePosts = $derived.by(() => {
  const term = filterTerm.trim().toLowerCase();
  if (!term) return posts;
  const tagOnly = term.startsWith('#') ? term.slice(1) : null;
  return posts.filter((p) => {
    const rawTags = Array.isArray(p.hashtags) ? (p.hashtags as string[]) : [];
    const hashtags = rawTags.map((h) => h.replace(/^#/, '').toLowerCase());
    if (tagOnly !== null) return hashtags.some((h) => h.includes(tagOnly));
    const content = String(p.content ?? '').toLowerCase();
    const authorName = (p.author as { name?: string } | undefined)?.name;
    const author = authorName ? authorName.toLowerCase() : '';
    return (
      content.includes(term) ||
      author.includes(term) ||
      hashtags.some((h) => h.includes(term))
    );
  });
});

let sentinelEl: HTMLDivElement | undefined = $state();

$effect(() => {
  if (!sentinelEl || !browser) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading && !loadingMore) {
        onloadmore();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(sentinelEl);
  return () => observer.disconnect();
});
</script>

<div class="mt-6 space-y-4">
	{#each visiblePosts as post, i (String(post.id))}
		<div in:fly={{ y: 8, duration: 220, easing: cubicOut }}>
			<PostCard
				post={{
					...post,
					isLiked: isPostLiked(post),
					isBookmarked: isPostBookmarked(post)
				}}
				{currentUserId}
				fitScore={fitScoreByPostId[String(post.id)] ?? null}
				{onlike}
				{onunlike}
				{onbookmark}
				{onunbookmark}
				{ondelete}
				{onrepost}
				{onreport}
				{onvote}
			/>
		</div>
		{#if (i + 1) % 8 === 0 && suggestions.length >= 3 && i < visiblePosts.length - 1}
			{@const block = Math.floor((i + 1) / 8) - 1}
			{@const chunkSize = 6}
			{@const start = (block * chunkSize) % Math.max(1, suggestions.length)}
			{@const pool = suggestions.concat(suggestions)}
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
					seeAllHref="/social/network/suggestions"
					source="feed_inline"
				/>
			{/if}
		{/if}
	{/each}
</div>

{#if isLoading && visiblePosts.length === 0}
	<div class="mt-6">
		<PostSkeleton count={3} />
	</div>
{:else if isError && visiblePosts.length === 0}
	<div class="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/10">
		<AlertCircle size={32} class="mx-auto mb-2 text-red-500" />
		<p class="text-sm text-gray-800 dark:text-neutral-200">{t('feed.errorLoading')}</p>
		<Button variant="ghost" size="sm" class="mt-3" onclick={onretry}>
			{t('feed.retry')}
		</Button>
	</div>
{:else if visiblePosts.length === 0 && !isLoading}
	{#if filterTerm.trim()}
		<div class="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
			<SearchX size={32} class="text-gray-400 dark:text-neutral-500" />
			<div>
				<p class="text-sm font-medium text-gray-700 dark:text-neutral-200">
					{t('feed.sidebar.emptySearchTitle') ?? 'Nada encontrado'}
				</p>
				<p class="mt-1 text-xs text-gray-500 dark:text-neutral-500">
					{t('feed.sidebar.emptySearchHint') ?? 'Tente outro termo ou limpe a busca.'}
				</p>
			</div>
			{#if onclearsearch}
				<Button variant="ghost" size="sm" onclick={onclearsearch}>
					{t('feed.sidebar.clearSearch') ?? t('feed.list.clearSearchFallback')}
				</Button>
			{/if}
		</div>
	{:else}
		<div class="py-12">
			<EmptyState
				message={t('feed.noPost')}
				icon={asIcon(PenSquare)}
			/>
		</div>
	{/if}
{/if}

{#if hasMore && visiblePosts.length > 0 && !filterTerm.trim()}
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
