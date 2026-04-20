<script lang="ts">
import { Bookmark, MessageCircle, Repeat2 } from 'lucide-svelte';
import { ReactionPicker, type ReactionType, Tooltip } from 'ui';
import { locale } from '$lib/locale.svelte';

type Props = {
  post: Record<string, unknown>;
  isLiked: boolean;
  isBookmarked: boolean;
  currentReaction?: string | null;
  onlike: (reactionType?: ReactionType) => void;
  onunlike: () => void;
  onbookmark: () => void;
  onunbookmark: () => void;
  oncommenttoggle: () => void;
  onrepost: () => void;
};

let {
  post,
  isLiked,
  isBookmarked,
  currentReaction,
  onlike,
  onunlike,
  onbookmark,
  onunbookmark,
  oncommenttoggle,
  onrepost,
}: Props = $props();

const t = $derived(locale.t);
const commentCount = $derived(Number(post.commentCount ?? post.commentsCount ?? 0));
const repostCount = $derived(Number(post.repostCount ?? post.repostsCount ?? 0));
const isReposted = $derived(Boolean(post.isReposted));
const likeCount = $derived(Number(post.likesCount ?? post.likeCount ?? 0));

const normalizedReaction = $derived<ReactionType | null>(
  currentReaction
    ? (String(currentReaction).toUpperCase() as ReactionType)
    : isLiked
      ? 'LIKE'
      : null,
);

const reactionLabels = $derived({
  react: t('feed.reactions.react'),
  triggerAriaLabel: t('feed.reactions.triggerAriaLabel'),
  reaction: (type: ReactionType) => t(`feed.reactions.${type}`),
});

function handleReact(type: ReactionType | null) {
  if (type === null) onunlike();
  else onlike(type);
}
</script>

<div class="flex items-center gap-2">
	<ReactionPicker
		current={normalizedReaction}
		count={likeCount}
		labels={reactionLabels}
		onreact={handleReact}
	/>

	<Tooltip text={t('feed.comments')} position="bottom">
		<button
			class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50"
			onclick={oncommenttoggle}
		>
			<MessageCircle size={16} />
			{#if commentCount > 0}
				<span class="text-xs font-medium">{commentCount}</span>
			{/if}
		</button>
	</Tooltip>

	<Tooltip text={t('feed.repostAction')} position="bottom">
		<button
			class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors {isReposted
				? 'text-emerald-600 dark:text-emerald-400 cursor-default'
				: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50'}"
			onclick={onrepost}
			disabled={isReposted}
		>
			<Repeat2 size={16} />
			{#if repostCount > 0}
				<span class="text-xs font-medium">{repostCount}</span>
			{/if}
		</button>
	</Tooltip>

	<div class="ml-auto">
		<Tooltip text={isBookmarked ? t('feed.removeBookmark') : t('feed.bookmarkAction')} position="bottom">
			<button
				class="flex items-center rounded-lg px-2.5 py-1.5 transition-colors {isBookmarked
					? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
					: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50'}"
				onclick={() => (isBookmarked ? onunbookmark() : onbookmark())}
			>
				{#if isBookmarked}
					<Bookmark size={16} fill="currentColor" />
				{:else}
					<Bookmark size={16} />
				{/if}
			</button>
		</Tooltip>
	</div>
</div>
