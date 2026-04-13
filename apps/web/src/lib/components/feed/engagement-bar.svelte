<script lang="ts">
	import { Tooltip, Button } from 'ui';
	import { MessageCircle, Repeat2, Bookmark } from 'lucide-svelte';
	import ReactionPicker from './reaction-picker.svelte';

	type Props = {
		post: Record<string, unknown>;
		isLiked: boolean;
		isBookmarked: boolean;
		reactionCounts?: Record<string, number>;
		currentReaction?: string | null;
		onlike: (reactionType?: string) => void;
		onunlike: () => void;
		onbookmark: () => void;
		onunbookmark: () => void;
		oncommenttoggle: () => void;
		onrepost: () => void;
	};

	let { post, isLiked, isBookmarked, reactionCounts, currentReaction, onlike, onunlike, onbookmark, onunbookmark, oncommenttoggle, onrepost }: Props = $props();

	const commentCount = $derived(Number(post.commentCount ?? post.commentsCount ?? 0));
	const repostCount = $derived(Number(post.repostCount ?? post.repostsCount ?? 0));
</script>

<div class="flex items-center gap-2">
	<ReactionPicker
		currentReaction={currentReaction ?? (isLiked ? 'LIKE' : null)}
		reactionCounts={reactionCounts ?? {}}
		onreact={(type) => onlike(type)}
		onremove={onunlike}
	/>

	<Tooltip text="Comments" position="bottom">
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

	<Tooltip text="Repost" position="bottom">
		<button
			class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50"
			onclick={onrepost}
		>
			<Repeat2 size={16} />
			{#if repostCount > 0}
				<span class="text-xs font-medium">{repostCount}</span>
			{/if}
		</button>
	</Tooltip>

	<div class="ml-auto">
		<Tooltip text={isBookmarked ? 'Remove bookmark' : 'Bookmark'} position="bottom">
			<button
				class="flex items-center rounded-lg px-2.5 py-1.5 transition-colors {isBookmarked ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50'}"
				onclick={() => isBookmarked ? onunbookmark() : onbookmark()}
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
