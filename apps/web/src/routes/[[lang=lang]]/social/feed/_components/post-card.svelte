<script lang="ts">
import { formatDate } from 'i18n';
import {
  Clock,
  Flag,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Trash2,
  Zap,
} from 'lucide-svelte';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  FitScoreChip,
  Poll,
  type PollOption,
  QuoteCard,
} from 'ui';
import BlockMenuItem from '$lib/components/moderation/block-menu-item.svelte';
import { renderRichText } from '$lib/utils/linkify';
import { relativeFrom } from '$lib/utils/relative';
import { locale } from '$lib/state/locale.svelte';
import { timeTicker } from '$lib/state/time-ticker.svelte';
import CommentSection from './comment-section.svelte';
import EngagementBar from './engagement-bar.svelte';

export type PostFitScore = {
  score: number;
  breakdown: {
    matchedSkills: string[];
    missingSkills: string[];
    englishMatch?: number;
    remoteMatch?: number;
  };
};

type Props = {
  post: Record<string, unknown>;
  currentUserId: string;
  fitScore?: PostFitScore | null;
  onlike: (id: string) => void;
  onunlike: (id: string) => void;
  onbookmark: (id: string) => void;
  onunbookmark: (id: string) => void;
  ondelete: (id: string) => void;
  onrepost: (id: string) => void;
  onreport: (id: string) => void;
  onvote?: (id: string, optionIndex: number) => void;
};

let {
  post,
  currentUserId,
  fitScore = null,
  onlike,
  onunlike,
  onbookmark,
  onunbookmark,
  ondelete,
  onrepost,
  onreport,
  onvote,
}: Props = $props();

let showComments = $state(false);
let showMenu = $state(false);

interface PostAuthor {
  id?: string;
  name?: string;
  username?: string;
  photoURL?: string;
  avatarUrl?: string;
}
interface PostData {
  imageUrl?: string;
  options?: { text?: string; label?: string; votes?: number }[];
  title?: string;
  question?: string;
  organization?: string;
  date?: string;
  commitment?: string;
  contact_method?: string;
  project_url?: string;
  application?: string;
  difficulty?: string;
  deadline?: string;
  description?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  pollDeadline?: string;
}
interface PostLinkPreview {
  url?: string;
  image?: string;
  title?: string;
  description?: string;
}

const postId = $derived(String(post.id));
const author = $derived(post.author as PostAuthor | undefined);
const authorName = $derived(String(author?.name ?? author?.username ?? 'Unknown'));
const authorUsername = $derived(String(author?.username));
const authorPhoto = $derived(author?.photoURL ?? author?.avatarUrl);
const postType = $derived(String(post.type));
const data = $derived(post.data as PostData | undefined);
const content = $derived(post.content ? String(post.content) : '');
const imageUrl = $derived((post.imageUrl ?? data?.imageUrl) as string | undefined);
const videoUrl = $derived(post.videoUrl as string | undefined);
const linkPreview = $derived(post.linkPreview as PostLinkPreview | undefined);
const linkUrl = $derived(post.linkUrl as string | undefined);
const hardSkills = $derived((post.hardSkills ?? post.hard_skills) as string[] | undefined);
const softSkills = $derived((post.softSkills ?? post.soft_skills) as string[] | undefined);
const isLiked = $derived(Boolean(post.isLiked ?? post.liked));
const isBookmarked = $derived(Boolean(post.isBookmarked ?? post.bookmarked));
const isAnonymous = $derived(Boolean(post.isAnonymous));
const anonymousCategory = $derived(post.anonymousCategory as string | undefined);

// Orphan-key scanner detects this template literal under `t(...)` and
// keeps `feed.anonymous.categories.*` alive.
const anonymousCategoryLabel = $derived.by(() => {
  if (!anonymousCategory) return '';
  const translated = locale.t(`feed.anonymous.categories.${anonymousCategory}`);
  return translated.startsWith('feed.anonymous.categories.') ? anonymousCategory : translated;
});
// When anonymous, the server already masks the author to `__anonymous__`;
// we also skip the owner branch so the author can't accidentally reveal
// themselves through owner-only UI (delete menu).
const isOwner = $derived(!isAnonymous && String(author?.id ?? post.userId) === currentUserId);
const createdAt = $derived(post.createdAt as string | undefined);
const coAuthors = $derived(post.coAuthors as PostAuthor[] | undefined);
const threadParentId = $derived(post.threadParentId as string | undefined);
const hasThreadChildren = $derived(Boolean(post.threadChildren) || Boolean(post.isThread));
const scheduledAt = $derived(post.scheduledAt as string | undefined);
const hasVoted = $derived(Boolean(post.hasVoted));

// Quote repost (original post embedded)
const originalPost = $derived(post.originalPost as Record<string, unknown> | undefined);
const originalAuthor = $derived(originalPost?.author as PostAuthor | undefined);
const isRepost = $derived(postType === 'REPOST' && Boolean(originalPost));

// Code snippet fields
const codeSnippet = $derived(data?.codeSnippet ?? (post.codeSnippet as string | undefined));
const codeLanguage = $derived(data?.codeLanguage ?? (post.codeLanguage as string | undefined));

// Challenge fields
const challengeDifficulty = $derived(data?.difficulty as string | undefined);
const challengeDeadline = $derived(data?.deadline as string | undefined);
const responseCount = $derived(Number(post.responseCount ?? 0));

// Poll deadline
const pollDeadline = $derived((data?.pollDeadline ?? post.pollDeadline) as string | undefined);

// Scheduled post detection
const isScheduled = $derived.by(() => {
  if (!scheduledAt || !isOwner) return false;
  return new Date(scheduledAt).getTime() > Date.now();
});

const pollOptions = $derived(
  postType === 'QUESTION' && data?.options ? data.options : (null as PostData['options'] | null),
);

const pollMyVoteIndex = $derived(
  typeof post.myVoteIndex === 'number' ? (post.myVoteIndex as number) : null,
);

const normalizedPollOptions = $derived<PollOption[] | null>(
  pollOptions
    ? pollOptions.map((option, index) => ({
        id: String(index),
        label: String(option.text ?? option.label ?? option),
        votes: Number(option.votes ?? 0),
      }))
    : null,
);

const pollTotalVotes = $derived(
  typeof post.votesCount === 'number'
    ? (post.votesCount as number)
    : (normalizedPollOptions?.reduce((sum, o) => sum + o.votes, 0) ?? 0),
);

const t = $derived(locale.t);

const pollLabels = $derived({
  votes: (count: number) =>
    count === 0 ? t('feed.poll.votesZero') : t('feed.poll.votes', { count }),
  closed: t('feed.poll.closed'),
  closesIn: (value: string) => t('feed.poll.closesIn', { value }),
  humanDays: (n: number) => t('feed.poll.days', { count: n }),
  humanHours: (n: number) => t('feed.poll.hours', { count: n }),
  humanMinutes: (n: number) => t('feed.poll.minutes', { count: n }),
});

const title = $derived(data?.title ?? data?.question);

const typeBadgeVariant: Record<string, 'neutral' | 'success' | 'danger' | 'warning' | 'info'> = {
  ACHIEVEMENT: 'warning',
  OPPORTUNITY: 'info',
  LEARNING: 'neutral',
  BUILD: 'success',
  QUESTION: 'info',
  CHALLENGE: 'danger',
};

const typeBadgeLabel = $derived<Record<string, string>>({
  ACHIEVEMENT: t('feed.postTypes.ACHIEVEMENT'),
  OPPORTUNITY: t('feed.postTypes.OPPORTUNITY'),
  LEARNING: t('feed.postTypes.LEARNING'),
  BUILD: t('feed.postTypes.BUILD'),
  QUESTION: t('feed.postTypes.QUESTION'),
  CHALLENGE: t('feed.postTypes.CHALLENGE'),
});

const difficultyBadgeVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger',
};

const relativeTime = $derived(relativeFrom(createdAt, timeTicker.now));

let showHeartBurst = $state(false);
let heartBurstTimer: ReturnType<typeof setTimeout> | null = null;
let lastClickAt = 0;

// "Ler mais" affordance on the content paragraph. Detect overflow via
// scrollHeight (full text) vs clientHeight (visible clamped). Once the
// user expands, we don't collapse — keeps their place.
let bodyEl: HTMLParagraphElement | null = $state(null);
let expanded = $state(false);
let isTruncated = $state(false);

$effect(() => {
  if (!bodyEl) return;
  void content; // re-evaluate when content changes
  queueMicrotask(() => {
    if (!bodyEl) return;
    isTruncated = bodyEl.scrollHeight > bodyEl.clientHeight + 1;
  });
});

function triggerLike() {
  if (isLiked) return;
  onlike(postId);
}

function handleCardDoubleClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('button, a, input, textarea, [role="menu"], [role="menuitem"]')) return;
  if (heartBurstTimer) clearTimeout(heartBurstTimer);
  showHeartBurst = true;
  heartBurstTimer = setTimeout(() => (showHeartBurst = false), 700);
  triggerLike();
}

function handleCardTouchEnd(e: TouchEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('button, a, input, textarea, [role="menu"], [role="menuitem"]')) return;
  const now = Date.now();
  if (now - lastClickAt < 300) {
    if (heartBurstTimer) clearTimeout(heartBurstTimer);
    showHeartBurst = true;
    heartBurstTimer = setTimeout(() => (showHeartBurst = false), 700);
    triggerLike();
    lastClickAt = 0;
  } else {
    lastClickAt = now;
  }
}


function handleVoteClick(index: number) {
  if (hasVoted) return;
  if (pollDeadline && new Date(pollDeadline).getTime() < Date.now()) return;
  if (onvote) {
    onvote(postId, index);
  }
}

function handleDeleteRequest() {
  // No confirm modal: the parent page shows a toast with an Undo button
  // for the next 5s. Undo > confirm for reversible actions.
  showMenu = false;
  ondelete(postId);
}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article
	class="relative"
	ondblclick={handleCardDoubleClick}
	ontouchend={handleCardTouchEnd}
>
	{#if showHeartBurst}
		<div class="heart-burst pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
			<Heart size={96} class="text-rose-500" fill="currentColor" />
		</div>
	{/if}
	<div class="glass glass-reflect group rounded-[28px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] hover:border-black/10 sm:p-6 dark:hover:border-white/10 dark:hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.6)]">
		<!-- Scheduled badge -->
		{#if isScheduled}
			<div class="mb-3">
				<Badge intent="warning" size="md">
					<span class="flex items-center gap-1">
						<Clock size={12} />
						{t('feed.scheduled')}
					</span>
				</Badge>
			</div>
		{/if}

		<!-- Thread indicator -->
		{#if threadParentId}
			<div class="mb-2 flex items-center gap-1 text-xs text-gray-400 dark:text-neutral-500">
				<MessageSquare size={12} />
				<span>{t('feed.partOfThread')}</span>
			</div>
		{/if}

		<!-- Repost indicator: shown for both pure reposts and quote reposts -->
		{#if isRepost}
			<div class="mb-2 flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400">
				<Repeat2 size={12} />
				<span>{t('feed.repostedBy', { name: authorName })}</span>
			</div>
		{/if}

		<!-- Header: avatar + author info + menu -->
		<div class="flex items-start gap-3">
			<Avatar name={authorName} photoURL={authorPhoto} size="lg" shape="square" ring />

			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
					<span class="font-bold text-gray-900 dark:text-zinc-100">{authorName}</span>
					{#if isAnonymous}
						<span class="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
							{t('feed.anonymous.label')}{anonymousCategoryLabel ? ` · ${anonymousCategoryLabel}` : ''}
						</span>
					{/if}
					{#if coAuthors && !isAnonymous}
						{#each coAuthors as coAuthor}
							<span class="text-gray-400 dark:text-neutral-500">&</span>
							<span class="font-bold text-gray-900 dark:text-zinc-100">{coAuthor.name ?? coAuthor.username}</span>
						{/each}
					{/if}
					{#if authorUsername && !isAnonymous}
						<span class="text-xs font-medium text-gray-500 dark:text-zinc-500">@{authorUsername}</span>
					{/if}
				</div>
				<div class="mt-1 flex flex-wrap items-center gap-1.5">
					<span class="text-[11px] font-medium text-gray-500 dark:text-zinc-500">{relativeTime}</span>
					{#if postType && typeBadgeLabel[postType]}
						<span class="text-[11px] text-gray-400 dark:text-zinc-600">·</span>
						<Badge intent={typeBadgeVariant[postType]} size="sm">
							{typeBadgeLabel[postType]}
						</Badge>
					{/if}
					{#if postType === 'CHALLENGE' && challengeDifficulty}
						<Badge intent={difficultyBadgeVariant[challengeDifficulty] ?? 'neutral'} size="sm">
							{challengeDifficulty}
						</Badge>
					{/if}
				</div>
			</div>

			<Dropdown open={showMenu} align="right" onclose={() => showMenu = false}>
				{#snippet trigger()}
					<Button variant="icon" size="xs" onclick={() => showMenu = !showMenu}>
						<MoreHorizontal size={16} />
					</Button>
				{/snippet}
				{#if isOwner}
					<Button variant="menu" size="sm" onclick={handleDeleteRequest}>
						<Trash2 size={14} />
						{t('feed.deletePost')}
					</Button>
				{/if}
				{#if !isOwner}
					<Button variant="menu" size="sm" onclick={() => { showMenu = false; onreport(postId); }}>
						<Flag size={14} />
						{t('feed.reportPost')}
					</Button>
					{#if author?.id}
						<BlockMenuItem
							targetUserId={String(author.id)}
							targetName={authorName}
							source="post_card"
							onbeforeConfirm={() => (showMenu = false)}
						/>
					{/if}
				{/if}
			</Dropdown>
		</div>

		<!-- Title -->
		{#if title}
			<h3 class="mt-4 text-[15px] font-bold leading-snug text-gray-900 dark:text-zinc-100">{title}</h3>
		{/if}

		<!-- Content — clamped to ~6 lines when collapsed; "Ler mais" below
		     unfolds it. Pure Tailwind line-clamp, no inline style. -->
		{#if content}
			<p
				bind:this={bodyEl}
				class="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-gray-700 dark:text-zinc-300 {expanded
					? ''
					: 'line-clamp-6'}"
			>
				{@html renderRichText(content)}
			</p>
			{#if isTruncated && !expanded}
				<button
					type="button"
					class="mt-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
					onclick={() => (expanded = true)}
				>
					{t('feed.readMore')}
				</button>
			{/if}
		{/if}

		<!-- Quote repost: embed original post -->
		{#if isRepost && originalPost}
			<div class="mt-3">
				<QuoteCard
					authorName={String(originalAuthor?.name ?? originalAuthor?.username ?? 'Unknown')}
					authorUsername={originalAuthor?.username ?? null}
					authorAvatarUrl={originalAuthor?.photoURL ?? originalAuthor?.avatarUrl ?? null}
					createdAt={(originalPost.createdAt as string | undefined) ?? null}
					content={String(originalPost.content ?? '')}
				/>
			</div>
		{/if}

		<!-- Challenge card extras -->
		{#if postType === 'CHALLENGE'}
			{#if data?.description}
				<p class="mt-2 text-sm text-gray-600 dark:text-neutral-400">{data.description}</p>
			{/if}
			<div class="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-neutral-500">
				{#if challengeDeadline}
					<span class="flex items-center gap-1">
						<Clock size={12} />
						{t('feed.deadlineLabel', { date: formatDate(challengeDeadline, locale.current) })}
					</span>
				{/if}
				<span class="flex items-center gap-1">
					<Zap size={12} />
					{t('feed.responseCount', { count: responseCount })}
				</span>
			</div>
		{/if}

		<!-- Type-specific data fields -->
		{#if data}
			{#if postType === 'ACHIEVEMENT' && data.organization}
				<p class="mt-2 text-xs text-gray-400 dark:text-neutral-500">
					{data.date
						? t('feed.achievementAt', { org: data.organization, date: data.date })
						: t('feed.achievementAtOrg', { org: data.organization })}
				</p>
			{/if}
			{#if postType === 'OPPORTUNITY'}
				{#if fitScore}
					<div class="mt-2">
						<FitScoreChip
							score={fitScore.score}
							matchedSkills={fitScore.breakdown.matchedSkills}
							missingSkills={fitScore.breakdown.missingSkills}
							englishMatch={fitScore.breakdown.englishMatch}
							remoteMatch={fitScore.breakdown.remoteMatch}
							labels={{
								match: t('jobs.matchLabel'),
								title: t('jobs.fit.chipTitle'),
								matchedHeader: t('jobs.fit.matchedTitle'),
								missingHeader: t('jobs.fit.missingTitle'),
								englishLabel: t('jobs.fit.englishLabel'),
								remoteLabel: t('jobs.fit.remoteLabel'),
								englishOk: t('jobs.fit.englishOk'),
								englishBelow: t('jobs.fit.englishBelow'),
								englishUnknown: t('jobs.fit.englishUnknown'),
								remoteExact: t('jobs.fit.remoteExact'),
								remotePartial: t('jobs.fit.remotePartial'),
								remoteMismatch: t('jobs.fit.remoteMismatch'),
								none: t('jobs.fit.none'),
							}}
						/>
					</div>
				{/if}
				{#if data.commitment}
					<p class="mt-2 text-xs text-gray-400 dark:text-neutral-500">{t('feed.opportunityCommitment', { value: data.commitment })}</p>
				{/if}
				{#if data.contact_method}
					<p class="text-xs text-gray-400 dark:text-neutral-500">{t('feed.opportunityContact', { value: data.contact_method })}</p>
				{/if}
			{/if}
			{#if postType === 'BUILD' && data.project_url}
				<a href={String(data.project_url)} target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-xs text-blue-500 hover:underline">
					{data.project_url}
				</a>
			{/if}
			{#if postType === 'LEARNING' && data.application}
				<p class="mt-2 text-xs italic text-gray-400 dark:text-neutral-500">{t('feed.learningApplication', { value: data.application })}</p>
			{/if}
		{/if}

		<!-- Code snippet -->
		{#if codeSnippet}
			<div class="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/5">
				{#if codeLanguage}
					<div class="flex items-center justify-between border-b px-3 py-1.5 border-gray-200 dark:border-neutral-700/50 bg-gray-900">
						<span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">{codeLanguage}</span>
					</div>
				{/if}
				<pre class="overflow-x-auto p-3 text-xs bg-gray-900 text-gray-100"><code class="language-{(codeLanguage ?? '').toLowerCase()}">{codeSnippet}</code></pre>
			</div>
		{/if}

		<!-- Image -->
		{#if imageUrl}
			<div class="mt-4 overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/5">
				<img src={imageUrl} alt="" class="w-full object-cover" loading="lazy" />
			</div>
		{/if}

		<!-- Video -->
		{#if videoUrl}
			<div class="mt-4 overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/5 bg-black">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={videoUrl}
					controls
					preload="metadata"
					playsinline
					class="w-full"
				></video>
			</div>
		{/if}

		<!-- Link preview -->
		{#if linkPreview}
			<a
				href={String(linkPreview.url ?? linkUrl ?? '#')}
				target="_blank"
				rel="noopener noreferrer"
				class="mt-4 block overflow-hidden rounded-2xl border border-black/5 bg-black/[0.02] transition-all hover:border-black/10 hover:bg-black/[0.04] dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
			>
				{#if linkPreview.image}
					<img src={String(linkPreview.image)} alt="" class="h-32 w-full object-cover" loading="lazy" />
				{/if}
				<div class="p-3">
					{#if linkPreview.title}
						<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">{linkPreview.title}</p>
					{/if}
					{#if linkPreview.description}
						<p class="mt-1 line-clamp-2 text-xs text-gray-400 dark:text-neutral-500">{linkPreview.description}</p>
					{/if}
					<p class="mt-1 text-[10px] text-gray-400 dark:text-neutral-500">{linkPreview.url ?? linkUrl ?? ''}</p>
				</div>
			</a>
		{:else if linkUrl}
			<a href={linkUrl} target="_blank" rel="noopener noreferrer" class="mt-3 block text-xs text-blue-500 hover:underline break-all">
				{linkUrl}
			</a>
		{/if}

		<!-- Poll widget -->
		{#if normalizedPollOptions}
			<div class="mt-3">
				<Poll
					options={normalizedPollOptions}
					totalVotes={pollTotalVotes}
					myVote={pollMyVoteIndex !== null ? String(pollMyVoteIndex) : null}
					closesAt={pollDeadline ?? null}
					labels={pollLabels}
					onvote={(optionId) => handleVoteClick(Number(optionId))}
				/>
			</div>
		{/if}

		<!-- Skills tags -->
		{#if (hardSkills && hardSkills.length > 0) || (softSkills && softSkills.length > 0)}
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#if hardSkills}
				{#each hardSkills as skill}
					<Badge intent="neutral" size="sm">{skill}</Badge>
				{/each}
				{/if}
				{#if softSkills}
				{#each softSkills as skill}
					<Badge intent="info" size="sm">{skill}</Badge>
				{/each}
				{/if}
			</div>
		{/if}

		<!-- Engagement bar -->
		<div class="-mx-1 mt-4 border-t border-black/5 pt-3 dark:border-white/5">
			<EngagementBar
				{post}
				{isLiked}
				{isBookmarked}
				onlike={() => onlike(postId)}
				onunlike={() => onunlike(postId)}
				onbookmark={() => onbookmark(postId)}
				onunbookmark={() => onunbookmark(postId)}
				oncommenttoggle={() => showComments = !showComments}
				onrepost={() => onrepost(postId)}
			/>
		</div>

		<!-- Thread link -->
		{#if hasThreadChildren}
			<div class="mt-2 border-t pt-2 border-gray-100 dark:border-neutral-700/50">
				<a
					href="/social/feed/thread/{postId}"
					class="flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline"
				>
					<MessageSquare size={12} />
					{t('feed.viewThread')}
				</a>
			</div>
		{/if}

		<!-- Comment section -->
		{#if showComments}
			<div class="mt-2 border-t pt-3 border-gray-100 dark:border-neutral-700/50">
				<CommentSection postId={postId} currentUserId={currentUserId} />
			</div>
		{/if}
	</div>
</article>

<style>
	.heart-burst {
		animation: heart-burst 0.7s ease-out forwards;
	}
	@keyframes heart-burst {
		0% {
			opacity: 0;
			transform: scale(0.3);
		}
		30% {
			opacity: 1;
			transform: scale(1.1);
		}
		60% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.05);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.heart-burst {
			animation: none;
			opacity: 1;
		}
	}
</style>
