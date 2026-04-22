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
  Card,
  Dropdown,
  Poll,
  type PollOption,
  QuoteCard,
  type ReactionType,
} from 'ui';
import BlockMenuItem from '$lib/components/moderation/block-menu-item.svelte';
import { relativeFrom } from '$lib/format/relative';
import { locale } from '$lib/state/locale.svelte';
import { timeTicker } from '$lib/state/time-ticker.svelte';
import CommentSection from './comment-section.svelte';
import EngagementBar from './engagement-bar.svelte';

type Props = {
  post: Record<string, unknown>;
  currentUserId: string;
  onlike: (id: string, reactionType?: ReactionType) => void;
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
const linkPreview = $derived(post.linkPreview as PostLinkPreview | undefined);
const linkUrl = $derived(post.linkUrl as string | undefined);
const hardSkills = $derived((post.hardSkills ?? post.hard_skills) as string[] | undefined);
const softSkills = $derived((post.softSkills ?? post.soft_skills) as string[] | undefined);
const isLiked = $derived(Boolean(post.isLiked ?? post.liked));
const isBookmarked = $derived(Boolean(post.isBookmarked ?? post.bookmarked));
const isAnonymous = $derived(Boolean(post.isAnonymous));
const anonymousCategory = $derived(post.anonymousCategory as string | undefined);

const ANONYMOUS_CATEGORY_LABELS: Record<string, string> = {
  SALARY: 'Salário',
  INTERVIEW: 'Entrevista',
  LAYOFF: 'Demissão',
  TOXIC_CULTURE: 'Cultura tóxica',
  HARASSMENT: 'Assédio',
};
const anonymousCategoryLabel = $derived(
  anonymousCategory ? (ANONYMOUS_CATEGORY_LABELS[anonymousCategory] ?? anonymousCategory) : '',
);
// When anonymous, the server already masks the author to `__anonymous__`;
// we also skip the owner branch so the author can't accidentally reveal
// themselves through owner-only UI (delete menu).
const isOwner = $derived(!isAnonymous && String(author?.id ?? post.userId) === currentUserId);
const createdAt = $derived(post.createdAt as string | undefined);
const coAuthors = $derived(post.coAuthors as PostAuthor[] | undefined);
const threadParentId = $derived(post.threadParentId as string | undefined);
const hasThreadChildren = $derived(Boolean(post.threadChildren) || Boolean(post.isThread));
const scheduledAt = $derived(post.scheduledAt as string | undefined);
const currentReaction = $derived(post.reactionType as string | undefined);
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

function triggerLike() {
  if (isLiked) return;
  onlike(postId, 'LIKE');
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

function highlightHashtags(text: string): string {
  return text.replace(/(#\w+)/g, '<span class="text-blue-500">$1</span>');
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
	<Card class="shadow-sm hover:shadow-md transition-shadow">
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
			<Avatar name={authorName} photoURL={authorPhoto} size="lg" />

			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5 text-sm flex-wrap">
					<span class="font-semibold text-gray-800 dark:text-neutral-200">{authorName}</span>
					{#if isAnonymous}
						<span class="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
							Anônimo{anonymousCategoryLabel ? ` · ${anonymousCategoryLabel}` : ''}
						</span>
					{/if}
					{#if coAuthors && !isAnonymous}
						{#each coAuthors as coAuthor}
							<span class="text-gray-400 dark:text-neutral-500">&</span>
							<span class="font-semibold text-gray-800 dark:text-neutral-200">{coAuthor.name ?? coAuthor.username}</span>
						{/each}
					{/if}
					{#if authorUsername && !isAnonymous}
						<span class="text-gray-400 dark:text-neutral-500">@{authorUsername}</span>
					{/if}
					<span class="text-gray-400 dark:text-neutral-500">&middot;</span>
					<span class="text-xs text-gray-400 dark:text-neutral-500">{relativeTime}</span>
				</div>

				<div class="flex items-center gap-1.5 mt-1">
					{#if postType && typeBadgeLabel[postType]}
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
			<h3 class="mt-3 text-base font-semibold text-gray-800 dark:text-neutral-200">{title}</h3>
		{/if}

		<!-- Content -->
		{#if content}
			<p class="mt-2 text-sm leading-relaxed text-gray-800 dark:text-neutral-200 whitespace-pre-wrap">
				{@html highlightHashtags(content)}
			</p>
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
			<div class="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700/50">
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
			<div class="mt-3 overflow-hidden rounded-lg">
				<img src={imageUrl} alt="Post attachment" class="w-full object-cover" loading="lazy" />
			</div>
		{/if}

		<!-- Link preview -->
		{#if linkPreview}
			<a
				href={String(linkPreview.url ?? linkUrl ?? '#')}
				target="_blank"
				rel="noopener noreferrer"
				class="mt-3 block overflow-hidden rounded-lg border bg-gray-50 border-gray-200 dark:bg-neutral-700/30 dark:border-neutral-600/50 transition-opacity hover:opacity-80"
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
		<div class="mt-3 border-t pt-2 border-gray-100 dark:border-neutral-700/50">
			<EngagementBar
				{post}
				{isLiked}
				{isBookmarked}
				currentReaction={currentReaction ?? null}
				onlike={(reactionType?: ReactionType) => onlike(postId, reactionType)}
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
	</Card>
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
