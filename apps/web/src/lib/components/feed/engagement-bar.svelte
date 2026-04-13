<script lang="ts">
	import { Button } from 'ui';
	import { Heart, MessageCircle, Repeat2, Bookmark } from 'lucide-svelte';

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
		onrepost
	}: Props = $props();

	const likeCount = $derived(Number(post.likeCount ?? post.likesCount ?? 0));
	const commentCount = $derived(Number(post.commentCount ?? post.commentsCount ?? 0));
	const repostCount = $derived(Number(post.repostCount ?? post.repostsCount ?? 0));
</script>

<div class="flex items-center gap-1">
	<Button
		variant="ghost"
		size="xs"
		onclick={() => isLiked ? onunlike() : onlike()}
		class={isLiked ? 'text-red-500 hover:text-red-600' : ''}
	>
		{#if isLiked}
			<Heart size={16} fill="currentColor" />
		{:else}
			<Heart size={16} />
		{/if}
		{#if likeCount > 0}
			<span class="text-xs">{likeCount}</span>
		{/if}
	</Button>

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
