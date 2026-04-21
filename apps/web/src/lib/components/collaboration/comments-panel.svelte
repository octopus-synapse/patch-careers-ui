<!--
  CommentsPanel — collaboration feedback pane that lists review comments on a
  resume, supports replies, and marking threads resolved. Wraps the new
  /resumes/:id/comments endpoints.
-->
<script lang="ts">
import { CheckCircle2, Loader2, MessageSquare, Trash2 } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, toastState } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

interface CommentAuthor {
  id: string;
  name: string | null;
  username: string | null;
  photoURL: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  resolved: boolean;
  sectionId: string | null;
  itemId: string | null;
  author: CommentAuthor;
}

interface Props {
  resumeId: string;
  currentUserId: string;
  ownerId: string;
}

let { resumeId, currentUserId, ownerId }: Props = $props();

let comments = $state<Comment[]>([]);
let loading = $state(true);
let newContent = $state('');
let submitting = $state(false);
let showResolved = $state(false);

async function load() {
  loading = true;
  try {
    const res = await fetch(`/api/resumes/${resumeId}/comments`, { credentials: 'include' });
    const body = (await res.json()) as { data?: { comments?: Comment[] } };
    comments = body.data?.comments ?? [];
  } catch {
    toastState.show(t('errors.loadCommentsFailed'), 'danger');
  } finally {
    loading = false;
  }
}

async function create(parentId?: string, contentOverride?: string) {
  const content = (contentOverride ?? newContent).trim();
  if (!content) return;
  submitting = true;
  try {
    const res = await fetch(`/api/resumes/${resumeId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, parentId }),
    });
    if (!res.ok) throw new Error();
    if (!parentId) newContent = '';
    await load();
  } catch {
    toastState.show(t('errors.submitCommentFailed'), 'danger');
  } finally {
    submitting = false;
  }
}

async function resolve(id: string) {
  try {
    const res = await fetch(`/api/resumes/comments/${id}/resolve`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    comments = comments.map((c) => (c.id === id ? { ...c, resolved: true } : c));
  } catch {
    toastState.show(t('errors.resolveCommentFailed'), 'danger');
  }
}

async function remove(id: string) {
  if (!confirm('Remover este comentário?')) return;
  try {
    const res = await fetch(`/api/resumes/comments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    comments = comments.filter((c) => c.id !== id);
  } catch {
    toastState.show(t('errors.removeFailed'), 'danger');
  }
}

const topLevel = $derived(comments.filter((c) => !c.parentId && (showResolved || !c.resolved)));
const repliesByParent = $derived(
  comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      (acc[c.parentId] ??= []).push(c);
    }
    return acc;
  }, {}),
);

function canDelete(c: Comment): boolean {
  return c.author.id === currentUserId || ownerId === currentUserId;
}

let replyToId = $state<string | null>(null);
let replyContent = $state('');

async function submitReply(parentId: string) {
  if (!replyContent.trim()) return;
  await create(parentId, replyContent);
  replyContent = '';
  replyToId = null;
}

onMount(load);
</script>

<aside class="flex h-full w-full flex-col border-l border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
  <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-neutral-800">
    <div class="flex items-center gap-2">
      <MessageSquare size={16} />
      <h2 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">Comentários</h2>
    </div>
    <label class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500">
      <input type="checkbox" bind:checked={showResolved} class="rounded" />
      Mostrar resolvidos
    </label>
  </header>

  <div class="flex-1 overflow-y-auto p-4">
    {#if loading}
      <div class="flex justify-center py-10">
        <Loader2 size={16} class="animate-spin text-gray-500" />
      </div>
    {:else if topLevel.length === 0}
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

            {#if repliesByParent[c.id]?.length}
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
    <textarea
      bind:value={newContent}
      rows="3"
      placeholder="Adicionar comentário…"
      class="w-full rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-cyan-500 dark:border-neutral-700 dark:bg-neutral-800"
    ></textarea>
    <div class="mt-2 flex justify-end">
      <Button type="submit" size="sm" variant="solid" disabled={submitting || !newContent.trim()}>
        {#if submitting}
          <Loader2 size={14} class="animate-spin" />
        {:else}
          Comentar
        {/if}
      </Button>
    </div>
  </form>
</aside>
