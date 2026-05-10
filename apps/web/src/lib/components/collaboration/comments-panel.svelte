<!--
  CommentsPanel — collaboration feedback pane that lists review comments on a
  resume, supports replies, and marking threads resolved. Wraps the new
  /resumes/:id/comments endpoints.
-->
<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  getV1ResumesResumeIdCommentsQueryKey,
  createDeleteV1ResumesCommentsCommentId,
  createGetV1ResumesResumeIdComments,
  createPostV1ResumesResumeIdComments,
  createPostV1ResumesCommentsCommentIdResolve,
  type GetV1ResumesResumeIdComments200,
} from 'api-client';
import { CheckCircle2, MessageSquare, Trash2 } from 'lucide-svelte';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { Button, Checkbox, Loader, Textarea } from 'ui';
import { browser } from '$app/environment';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

type Comment = GetV1ResumesResumeIdComments200['comments'][number];

interface Props {
  resumeId: string;
  currentUserId: string;
  ownerId: string;
}

let { resumeId, currentUserId, ownerId }: Props = $props();

const queryClient = useQueryClient();
const commentsQuery = createGetV1ResumesResumeIdComments(resumeId, {
  query: { enabled: browser },
});

let newContent = $state('');
let showResolved = $state(false);
let replyToId = $state<string | null>(null);
let replyContent = $state('');

const invalidate = () =>
  queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdCommentsQueryKey(resumeId) });

const createComment = createPostV1ResumesResumeIdComments({
  mutation: { onSuccess: invalidate, onError: handleApiError },
});
const resolveComment = createPostV1ResumesCommentsCommentIdResolve({
  mutation: { onSuccess: invalidate, onError: handleApiError },
});
const deleteComment = createDeleteV1ResumesCommentsCommentId({
  mutation: { onSuccess: invalidate, onError: handleApiError },
});

function create(parentId?: string, contentOverride?: string) {
  const content = (contentOverride ?? newContent).trim();
  if (!content) return;
  $createComment.mutate(
    { resumeId, data: { content, parentId } },
    {
      onSuccess: () => {
        if (!parentId) newContent = '';
      },
    },
  );
}

function resolve(commentId: string) {
  $resolveComment.mutate({ commentId });
}

function remove(commentId: string) {
  if (!confirm('Remover este comentário?')) return;
  $deleteComment.mutate({ commentId });
}

function submitReply(parentId: string) {
  if (!replyContent.trim()) return;
  create(parentId, replyContent);
  replyContent = '';
  replyToId = null;
}

function canDelete(c: Comment): boolean {
  return c.author.id === currentUserId || ownerId === currentUserId;
}

const allComments = $derived($commentsQuery.data?.comments);
const topLevel = $derived(
  allComments?.filter((c) => !c.parentId && (showResolved || !c.resolved)),
);
const repliesByParent = $derived(
  allComments?.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      (acc[c.parentId] ??= []).push(c);
    }
    return acc;
  }, {}),
);
</script>

<aside class="flex h-full w-full flex-col border-l border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
  <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-800">
    <div class="flex items-center gap-2">
      <MessageSquare size={16} />
      <h2 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">Comentários</h2>
    </div>
    <Checkbox bind:checked={showResolved} size="sm" class="text-xs text-gray-500 dark:text-neutral-500">
      <span class="text-xs">Mostrar resolvidos</span>
    </Checkbox>
  </header>

  <div class="flex-1 overflow-y-auto p-4">
    {#if $commentsQuery.isLoading}
      <div class="flex justify-center py-10">
        <Loader size={16} />
      </div>
    {:else if !topLevel || topLevel.length === 0}
      <p class="text-center text-xs text-gray-500 dark:text-neutral-500">Nenhum comentário.</p>
    {:else}
      <ul class="space-y-4">
        {#each topLevel as c (c.id)}
          <li
            class="rounded-lg border border-gray-200 p-3 dark:border-neutral-800"
            class:opacity-60={c.resolved}
          >
            <div class="mb-1 flex items-center justify-between text-xs">
              <span class="font-medium text-gray-800 dark:text-neutral-200">
                {c.author.name ?? c.author.username ?? 'Alguém'}
              </span>
              <span class="text-gray-400 dark:text-neutral-600">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
            <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-neutral-300">
              {c.content}
            </p>

            <div class="mt-2 flex items-center gap-2">
              {#if !c.resolved}
                <button
                  type="button"
                  class="text-xs text-emerald-600 hover:underline"
                  onclick={() => resolve(c.id)}
                >
                  <CheckCircle2 size={12} class="inline" /> Resolver
                </button>
              {:else}
                <span class="text-xs text-emerald-500">✓ Resolvido</span>
              {/if}
              <button
                type="button"
                class="text-xs text-gray-500 hover:underline"
                onclick={() => (replyToId = replyToId === c.id ? null : c.id)}
              >
                Responder
              </button>
              {#if canDelete(c)}
                <button
                  type="button"
                  class="text-xs text-red-500 hover:underline"
                  onclick={() => remove(c.id)}
                  aria-label="Delete comment"
                >
                  <Trash2 size={12} class="inline" />
                </button>
              {/if}
            </div>

            {#if replyToId === c.id}
              <form
                onsubmit={(e) => {
                  e.preventDefault();
                  submitReply(c.id);
                }}
                class="mt-2 flex gap-2"
              >
                <input
                  bind:value={replyContent}
                  placeholder="Responder…"
                  class="flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                />
                <Button type="submit" size="sm" variant="solid">Enviar</Button>
              </form>
            {/if}

            {#if repliesByParent?.[c.id]?.length}
              <ul class="mt-3 space-y-2 border-l border-gray-200 pl-3 dark:border-neutral-800">
                {#each repliesByParent[c.id] as r (r.id)}
                  <li class="text-xs">
                    <span class="font-medium text-gray-800 dark:text-neutral-200">
                      {r.author.name ?? r.author.username ?? 'Alguém'}:
                    </span>
                    <span class="text-gray-600 dark:text-neutral-400">{r.content}</span>
                    {#if canDelete(r)}
                      <button
                        type="button"
                        class="ml-2 text-red-400 hover:text-red-500"
                        onclick={() => remove(r.id)}
                        aria-label="Delete reply"
                      >
                        ×
                      </button>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <form
    class="border-t border-gray-200 p-3 dark:border-neutral-800"
    onsubmit={(e) => {
      e.preventDefault();
      create();
    }}
  >
    <Textarea
      bind:value={newContent}
      rows={3}
      placeholder="Adicionar comentário…"
    />
    <div class="mt-2 flex justify-end">
      <Button type="submit" size="sm" variant="solid" disabled={$createComment.isPending || !newContent.trim()}>
        {#if $createComment.isPending}
          <Loader size={14} />
        {:else}
          Comentar
        {/if}
      </Button>
    </div>
  </form>
</aside>
