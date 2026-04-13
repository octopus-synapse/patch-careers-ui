<script lang="ts">
	import { Avatar, Button, Input } from 'ui';
	import { Trash2, Send, Loader2 } from 'lucide-svelte';
	import { createCommentsGetByPost, commentsCreate, commentsDelete, getCommentsGetByPostQueryKey } from 'api-client';
	import { useQueryClient } from '@tanstack/svelte-query';

	type Props = {
		postId: string;
		currentUserId: string;
	};

	let { postId, currentUserId }: Props = $props();

	let commentText = $state('');
	let submitting = $state(false);
	let replyingTo = $state<string | null>(null);
	let replyText = $state('');
	let submittingReply = $state(false);
	let expandedReplies = $state<Set<string>>(new Set());

	const queryClient = useQueryClient();

	const commentsQuery = createCommentsGetByPost(
		() => postId,
		() => ({ limit: 50 }),
		() => ({
			query: {
				enabled: !!postId
			}
		})
	);

	const rawData = $derived(
		commentsQuery.data as Record<string, unknown>
	);
	const comments = $derived(
		(Array.isArray(rawData) ? rawData : (rawData as Record<string, unknown>)?.comments ?? []) as Record<string, unknown>[]
	);

	function formatRelativeTime(dateStr?: string): string {
		if (!dateStr) return '';
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diff = now - then;
		const seconds = Math.floor(diff / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		return `${days}d`;
	}

	async function handleSubmitComment() {
		if (!commentText.trim() || submitting) return;
		submitting = true;
		try {
			await commentsCreate(postId, {
				body: JSON.stringify({ content: commentText.trim() }),
				headers: { 'Content-Type': 'application/json' }
			});
			commentText = '';
			queryClient.invalidateQueries({ queryKey: getCommentsGetByPostQueryKey(postId) });
		} finally {
			submitting = false;
		}
	}

	async function handleSubmitReply(parentId: string) {
		if (!replyText.trim() || submittingReply) return;
		submittingReply = true;
		try {
			await commentsCreate(postId, {
				body: JSON.stringify({ content: replyText.trim(), parentId }),
				headers: { 'Content-Type': 'application/json' }
			});
			replyText = '';
			replyingTo = null;
			queryClient.invalidateQueries({ queryKey: getCommentsGetByPostQueryKey(postId) });
		} finally {
			submittingReply = false;
		}
	}

	async function handleDeleteComment(commentId: string) {
		await commentsDelete(commentId);
		queryClient.invalidateQueries({ queryKey: getCommentsGetByPostQueryKey(postId) });
	}

	function toggleExpandReplies(commentId: string) {
		const next = new Set(expandedReplies);
		if (next.has(commentId)) {
			next.delete(commentId);
		} else {
			next.add(commentId);
		}
		expandedReplies = next;
	}

	function handleCommentKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmitComment();
		}
	}

	function handleReplyKeydown(e: KeyboardEvent, parentId: string) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmitReply(parentId);
		}
	}
</script>

<div class="space-y-3">
	<!-- Comment input -->
	<div class="flex items-center gap-2">
		<Input
			placeholder="Write a comment..."
			bind:value={commentText}
			onkeydown={handleCommentKeydown}
		/>
		<Button variant="ghost" size="xs" onclick={handleSubmitComment} disabled={submitting || !commentText.trim()}>
			{#if submitting}
				<Loader2 size={14} class="animate-spin" />
			{:else}
				<Send size={14} />
			{/if}
		</Button>
	</div>

	<!-- Loading -->
	{#if commentsQuery.isLoading}
		<div class="flex justify-center py-4">
			<Loader2 size={16} class="animate-spin text-gray-400 dark:text-neutral-500" />
		</div>
	{/if}

	<!-- Comments list -->
	{#each comments as comment}
		{@const commentAuthor = comment.author as Record<string, unknown> | undefined}
		{@const commentId = String(comment.id ?? '')}
		{@const isOwnComment = String(commentAuthor?.id ?? comment.userId ?? '') === currentUserId}
		{@const replies = (comment.replies ?? []) as Record<string, unknown>[]}
		{@const isExpanded = expandedReplies.has(commentId)}
		{@const visibleReplies = isExpanded ? replies : replies.slice(0, 2)}

		<div class="space-y-2">
			<div class="flex items-start gap-2">
				<Avatar
					name={String(commentAuthor?.name ?? commentAuthor?.username ?? '?')}
					photoURL={(commentAuthor?.photoURL ?? commentAuthor?.avatarUrl ?? null) as string | null}
					size="sm"
				/>
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-1.5">
						<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{commentAuthor?.name ?? commentAuthor?.username ?? 'Unknown'}</span>
						<span class="text-[10px] text-gray-400 dark:text-neutral-500">{formatRelativeTime(comment.createdAt as string | undefined)}</span>
					</div>
					<p class="mt-0.5 text-sm text-gray-800 dark:text-neutral-200">{comment.content}</p>
					<div class="mt-1 flex items-center gap-2">
						<button
							class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500 hover:opacity-70"
							onclick={() => { replyingTo = replyingTo === commentId ? null : commentId; replyText = ''; }}
						>
							Reply
						</button>
						{#if isOwnComment}
							<button
								class="text-[10px] text-red-400 hover:text-red-500"
								onclick={() => handleDeleteComment(commentId)}
							>
								<Trash2 size={12} />
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Reply input -->
			{#if replyingTo === commentId}
				<div class="ml-10 flex items-center gap-2">
					<Input
						placeholder="Reply..."
						bind:value={replyText}
						onkeydown={(e: KeyboardEvent) => handleReplyKeydown(e, commentId)}
					/>
					<Button variant="ghost" size="xs" onclick={() => handleSubmitReply(commentId)} disabled={submittingReply || !replyText.trim()}>
						{#if submittingReply}
							<Loader2 size={14} class="animate-spin" />
						{:else}
							<Send size={14} />
						{/if}
					</Button>
				</div>
			{/if}

			<!-- Replies -->
			{#if replies.length > 0}
				<div class="ml-10 space-y-2 border-l-2 pl-3 border-gray-100 dark:border-neutral-700/50">
					{#each visibleReplies as reply}
						{@const replyAuthor = reply.author as Record<string, unknown> | undefined}
						{@const replyId = String(reply.id ?? '')}
						{@const isOwnReply = String(replyAuthor?.id ?? reply.userId ?? '') === currentUserId}

						<div class="flex items-start gap-2">
							<Avatar
								name={String(replyAuthor?.name ?? replyAuthor?.username ?? '?')}
								photoURL={(replyAuthor?.photoURL ?? replyAuthor?.avatarUrl ?? null) as string | null}
								size="sm"
							/>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-1.5">
									<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{replyAuthor?.name ?? replyAuthor?.username ?? 'Unknown'}</span>
									<span class="text-[10px] text-gray-400 dark:text-neutral-500">{formatRelativeTime(reply.createdAt as string | undefined)}</span>
								</div>
								<p class="mt-0.5 text-sm text-gray-800 dark:text-neutral-200">{reply.content}</p>
								{#if isOwnReply}
									<button
										class="mt-1 text-[10px] text-red-400 hover:text-red-500"
										onclick={() => handleDeleteComment(replyId)}
									>
										<Trash2 size={12} />
									</button>
								{/if}
							</div>
						</div>
					{/each}

					{#if replies.length > 2 && !isExpanded}
						<button
							class="text-xs font-medium text-blue-500 hover:underline"
							onclick={() => toggleExpandReplies(commentId)}
						>
							View {replies.length - 2} more {replies.length - 2 === 1 ? 'reply' : 'replies'}
						</button>
					{:else if replies.length > 2 && isExpanded}
						<button
							class="text-xs font-medium text-blue-500 hover:underline"
							onclick={() => toggleExpandReplies(commentId)}
						>
							Show less
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/each}

	{#if !commentsQuery.isLoading && comments.length === 0}
		<p class="py-2 text-center text-xs text-gray-400 dark:text-neutral-500">No comments yet</p>
	{/if}
</div>
