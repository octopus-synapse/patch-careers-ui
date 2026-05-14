<script lang="ts">
import { Bookmark, Heart, MessageCircle, Repeat2 } from 'lucide-svelte';
import { Tooltip } from 'ui';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  post: Record<string, unknown>;
  isLiked: boolean;
  isBookmarked: boolean;
  onlike: () => void;
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

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}
</script>

<div class="flex items-center gap-1">
	<Tooltip text={isLiked ? t('feed.removeLike') ?? 'Unlike' : t('feed.likeAction') ?? 'Like'} position="bottom">
		<button
			type="button"
			class="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors {isLiked
				? 'text-rose-500 dark:text-rose-400'
				: 'text-gray-500 hover:text-rose-500 hover:bg-rose-500/5 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10'}"
			onclick={() => (isLiked ? onunlike() : onlike())}
		>
			<Heart size={18} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={1.75} />
			{#if likeCount > 0}
				<span class="text-xs font-semibold tabular-nums">{formatCount(likeCount)}</span>
			{/if}
		</button>
	</Tooltip>

	<Tooltip text={t('feed.comments')} position="bottom">
		<button
			type="button"
			class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-blue-500/5 hover:text-blue-500 dark:text-zinc-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
			onclick={oncommenttoggle}
		>
			<MessageCircle size={18} strokeWidth={1.75} />
			{#if commentCount > 0}
				<span class="text-xs font-semibold tabular-nums">{formatCount(commentCount)}</span>
			{/if}
		</button>
	</Tooltip>

	<Tooltip text={t('feed.repostAction')} position="bottom">
		<button
			type="button"
			disabled={isReposted}
			class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors {isReposted
				? 'text-emerald-500 dark:text-emerald-400 cursor-default'
				: 'text-gray-500 hover:bg-emerald-500/5 hover:text-emerald-500 dark:text-zinc-500 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400'}"
			onclick={onrepost}
		>
			<Repeat2 size={18} strokeWidth={1.75} />
			{#if repostCount > 0}
				<span class="text-xs font-semibold tabular-nums">{formatCount(repostCount)}</span>
			{/if}
		</button>
	</Tooltip>

	<div class="ml-auto">
		<Tooltip text={isBookmarked ? t('feed.removeBookmark') : t('feed.bookmarkAction')} position="bottom">
			<button
				type="button"
				class="flex items-center rounded-lg px-2 py-1.5 transition-colors {isBookmarked
					? 'text-blue-500 dark:text-blue-400'
					: 'text-gray-500 hover:bg-blue-500/5 hover:text-blue-500 dark:text-zinc-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400'}"
				onclick={() => (isBookmarked ? onunbookmark() : onbookmark())}
			>
				<Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} strokeWidth={1.75} />
			</button>
		</Tooltip>
	</div>
</div>
