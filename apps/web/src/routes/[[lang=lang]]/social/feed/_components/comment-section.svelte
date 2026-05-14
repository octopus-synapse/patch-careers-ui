<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  deleteV1PostsCommentsId,
  postV1PostsIdComments,
  createGetV1PostsIdComments,
  getV1PostsIdCommentsQueryKey,
} from 'api-client';
import { Send, Trash2 } from 'lucide-svelte';
import { Avatar, Button, Input, Loader } from 'ui';
import BlockMenuItem from '$lib/components/moderation/block-menu-item.svelte';
import { relativeFrom } from '$lib/utils/relative';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

/**
 * Frontend-burro comment thread for a single post. Reads `GET
 * /api/v1/posts/:id/comments`, writes via `POST .../comments` and `DELETE
 * .../comments/:id`.
 */
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

const commentsQuery = createGetV1PostsIdComments(() => postId,
  { limit: 50 },
  { query: { enabled: () => postId !== '' } },
);

const comments = $derived($commentsQuery.data?.items);

async function handleSubmitComment() {
  const trimmed = commentText.trim();
  if (!trimmed || submitting) return;
  submitting = true;
  // Clear optimistically — restore on failure so the user can retry without retyping.
  const previous = commentText;
  commentText = '';
  try {
    await postV1PostsIdComments(postId, { content: trimmed });
    queryClient.invalidateQueries({ queryKey: getV1PostsIdCommentsQueryKey(postId) });
  } catch (err) {
    commentText = previous;
    throw err;
  } finally {
    submitting = false;
  }
}

async function handleSubmitReply(parentId: string) {
  if (!replyText.trim() || submittingReply) return;
  submittingReply = true;
  try {
    await postV1PostsIdComments(postId, { content: replyText.trim(), parentId });
    replyText = '';
    replyingTo = null;
    queryClient.invalidateQueries({ queryKey: getV1PostsIdCommentsQueryKey(postId) });
  } finally {
    submittingReply = false;
  }
}

async function handleDeleteComment(commentId: string) {
  await deleteV1PostsCommentsId(commentId);
  queryClient.invalidateQueries({ queryKey: getV1PostsIdCommentsQueryKey(postId) });
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
    void handleSubmitComment();
  }
}

function handleReplyKeydown(e: KeyboardEvent, parentId: string) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    void handleSubmitReply(parentId);
  }
}
</script>

<div class="space-y-3">
	<!-- Comment input -->
	<div class="flex items-center gap-2">
		<Input
			placeholder={t('feed.commentsList.writePlaceholder')}
			bind:value={commentText}
			onkeydown={handleCommentKeydown}
		/>
		<Button variant="ghost" size="xs" onclick={handleSubmitComment} disabled={submitting || !commentText.trim()}>
			{#if submitting}
				<Loader size={14} />
			{:else}
				<Send size={14} />
			{/if}
		</Button>
	</div>

	<!-- Loading -->
	{#if $commentsQuery.isLoading}
		<div class="flex justify-center py-4">
			<Loader size={16} />
		</div>
	{/if}

	<!-- Comments list -->
	{#if comments && comments.length > 0}
		{#each comments as comment (comment.id)}
			{@const commentAuthor = comment.author}
			{@const isOwnComment = comment.authorId === currentUserId}
			{@const replies = comment.replies}
			{@const isExpanded = expandedReplies.has(comment.id)}
			{@const visibleReplies = isExpanded ? replies : replies.slice(0, 2)}

			<div class="space-y-2">
				<div class="flex items-start gap-2">
					<Avatar
						name={commentAuthor.name ?? commentAuthor.username ?? '?'}
						photoURL={commentAuthor.photoURL}
						size="sm"
					/>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{commentAuthor.name ?? commentAuthor.username ?? 'Unknown'}</span>
							<span class="text-[10px] text-gray-400 dark:text-neutral-500">{relativeFrom(comment.createdAt)}</span>
						</div>
						<p class="mt-0.5 text-sm text-gray-800 dark:text-neutral-200">{comment.content}</p>
						<div class="mt-1 flex items-center gap-2">
							<Button
								variant="ghost"
								size="xs"
								onclick={() => { replyingTo = replyingTo === comment.id ? null : comment.id; replyText = ''; }}
							>
								Reply
							</Button>
							{#if isOwnComment}
								<Button
									variant="icon"
									size="xs"
									onclick={() => handleDeleteComment(comment.id)}
									class="text-red-400 hover:text-red-500"
								>
									<Trash2 size={12} />
								</Button>
							{:else}
								<BlockMenuItem
									variant="ghost"
									size="xs"
									targetUserId={commentAuthor.id}
									targetName={commentAuthor.name ?? commentAuthor.username ?? ''}
									source="comment"
								/>
							{/if}
						</div>
					</div>
				</div>

				<!-- Reply input -->
				{#if replyingTo === comment.id}
					<div class="ml-4 sm:ml-10 flex items-center gap-2">
						<Input
							placeholder={t('feed.commentsList.replyPlaceholder')}
							bind:value={replyText}
							onkeydown={(e: KeyboardEvent) => handleReplyKeydown(e, comment.id)}
						/>
						<Button variant="ghost" size="xs" onclick={() => handleSubmitReply(comment.id)} disabled={submittingReply || !replyText.trim()}>
							{#if submittingReply}
								<Loader size={14} />
							{:else}
								<Send size={14} />
							{/if}
						</Button>
					</div>
				{/if}

				<!-- Replies -->
				{#if replies.length > 0}
					<div class="ml-4 sm:ml-10 space-y-2 border-l-2 pl-2 sm:pl-3 border-gray-100 dark:border-neutral-700/50">
						{#each visibleReplies as reply (reply.id)}
							{@const replyAuthor = reply.author}
							{@const isOwnReply = reply.authorId === currentUserId}

							<div class="flex items-start gap-2">
								<Avatar
									name={replyAuthor.name ?? replyAuthor.username ?? '?'}
									photoURL={replyAuthor.photoURL}
									size="sm"
								/>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-1.5">
										<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{replyAuthor.name ?? replyAuthor.username ?? 'Unknown'}</span>
										<span class="text-[10px] text-gray-400 dark:text-neutral-500">{relativeFrom(reply.createdAt)}</span>
									</div>
									<p class="mt-0.5 text-sm text-gray-800 dark:text-neutral-200">{reply.content}</p>
									{#if isOwnReply}
										<Button
											variant="icon"
											size="xs"
											onclick={() => handleDeleteComment(reply.id)}
											class="mt-1 text-red-400 hover:text-red-500"
										>
											<Trash2 size={12} />
										</Button>
									{:else}
										<div class="mt-1">
											<BlockMenuItem
												variant="ghost"
												size="xs"
												targetUserId={replyAuthor.id}
												targetName={replyAuthor.name ?? replyAuthor.username ?? ''}
												source="comment_reply"
											/>
										</div>
									{/if}
								</div>
							</div>
						{/each}

						{#if replies.length > 2 && !isExpanded}
							<Button
								variant="ghost"
								size="xs"
								onclick={() => toggleExpandReplies(comment.id)}
							>
								View {replies.length - 2} more {replies.length - 2 === 1 ? 'reply' : 'replies'}
							</Button>
						{:else if replies.length > 2 && isExpanded}
							<Button
								variant="ghost"
								size="xs"
								onclick={() => toggleExpandReplies(comment.id)}
							>
								{t('feed.commentsList.showLess')}
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	{/if}

	{#if !$commentsQuery.isLoading && (!comments || comments.length === 0)}
		<p class="py-2 text-center text-xs text-gray-400 dark:text-neutral-500">No comments yet</p>
	{/if}
</div>
