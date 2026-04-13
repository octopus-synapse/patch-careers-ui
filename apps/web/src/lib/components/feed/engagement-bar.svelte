<script lang="ts">
	import { Button } from 'ui';
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

	let {
		post,
		isLiked,
		isBookmarked,
		reactionCounts,
		currentReaction,
		onlike,
		onunlike,
		onbookmark,
		onunbookmark,
		oncommenttoggle,
		onrepost
	}: Props = $props();

	const commentCount = $derived(Number(post.commentCount ?? post.commentsCount ?? 0));
	const repostCount = $derived(Number(post.repostCount ?? post.repostsCount ?? 0));

	function handleReact(reactionType: string) {
		onlike(reactionType);
	}

	function handleRemoveReaction() {
		onunlike();
	}
</script>

<div class="flex items-center gap-1">
	<ReactionPicker
		currentReaction={currentReaction ?? (isLiked ? 'LIKE' : null)}
		reactionCounts={reactionCounts ?? {}}
		onreact={handleReact}
		onremove={handleRemoveReaction}
	/>

	<Button variant="ghost" size="xs" onclick={oncommenttoggle}>
		<MessageCircle size={16} />
		{#if commentCount > 0}
			<span class="text-xs">{commentCount}</span>
		{/if}
	</Button>

	<Button variant="ghost" size="xs" onclick={onrepost}>
		<Repeat2 size={16} />
		{#if repostCount > 0}
			<span class="text-xs">{repostCount}</span>
		{/if}
	</Button>

	<div class="ml-auto">
		<Button
			variant="ghost"
			size="xs"
			onclick={() => isBookmarked ? onunbookmark() : onbookmark()}
			class={isBookmarked ? 'text-blue-500 hover:text-blue-600' : ''}
		>
			{#if isBookmarked}
				<Bookmark size={16} fill="currentColor" />
			{:else}
				<Bookmark size={16} />
			{/if}
		</Button>
	</div>
</div>
