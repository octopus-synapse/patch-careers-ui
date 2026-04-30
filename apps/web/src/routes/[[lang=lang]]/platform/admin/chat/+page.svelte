<script lang="ts">
  /**
   * Admin chat & collaborations — burra: chama SDK e renderiza listas.
   * Backend ainda devolve `void` no schema OpenAPI; cast local.
   */
  import {
    createAdminChatConversations,
    createAdminChatStats,
    createAdminCollaborationsList,
    createAdminCollaborationsStats,
  } from 'api-client';
  import { browser } from '$app/environment';
  import StatCard from '../_components/stat-card.svelte';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);

  type ChatStats = { totalConversations?: number; totalMessages?: number; activeUsers?: number };
  type CollabStats = { totalCollaborations?: number };
  type Conversation = {
    id: string;
    participants?: string[];
    lastMessage?: string;
    lastMessageAt?: string;
  };
  type Collaboration = {
    id: string;
    user?: string;
    resume?: string;
    role?: string;
    createdAt?: string;
  };
  type Paged<T> = { items?: T[]; totalPages?: number; page?: number };

  let activeTab = $state<'chat' | 'collaborations'>('chat');
  let chatPage = $state(1);
  let collabPage = $state(1);

  const chatStatsQuery = createAdminChatStats(() => ({
    query: { enabled: browser },
  }));
  const chatConversationsQuery = createAdminChatConversations(
    () => ({ page: String(chatPage), pageSize: '20' }),
    () => ({ query: { enabled: browser && activeTab === 'chat' } }),
  );
  const collabStatsQuery = createAdminCollaborationsStats(() => ({
    query: { enabled: browser },
  }));
  const collabListQuery = createAdminCollaborationsList(
    () => ({ page: String(collabPage), pageSize: '20' }),
    () => ({ query: { enabled: browser && activeTab === 'collaborations' } }),
  );

  const chatStats = $derived(chatStatsQuery.data as unknown as ChatStats | undefined);
  const chatData = $derived(chatConversationsQuery.data as unknown as Paged<Conversation> | undefined);
  const conversations = $derived(chatData?.items ?? []);
  const collabStats = $derived(collabStatsQuery.data as unknown as CollabStats | undefined);
  const collabData = $derived(collabListQuery.data as unknown as Paged<Collaboration> | undefined);
  const collaborations = $derived(collabData?.items ?? []);
</script>

<svelte:head>
  <title>{t('admin.chat.title')}</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
    {t('admin.chat.title')}
  </h1>

  <div class="flex gap-2">
    <button
      type="button"
      class="rounded-md border px-3 py-1.5 text-xs transition-colors {activeTab === 'chat'
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-gray-500 hover:bg-muted dark:text-neutral-500'}"
      onclick={() => (activeTab = 'chat')}
    >
      {t('admin.chat.chatTab')}
    </button>
    <button
      type="button"
      class="rounded-md border px-3 py-1.5 text-xs transition-colors {activeTab === 'collaborations'
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-gray-500 hover:bg-muted dark:text-neutral-500'}"
      onclick={() => (activeTab = 'collaborations')}
    >
      {t('admin.chat.collaborationsTab')}
    </button>
  </div>

  {#if activeTab === 'chat'}
    {#if chatStats}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t('admin.chat.totalConversations')} value={chatStats.totalConversations ?? 0} />
        <StatCard label={t('admin.chat.totalMessages')} value={chatStats.totalMessages ?? 0} />
        <StatCard label={t('admin.chat.activeUsers')} value={chatStats.activeUsers ?? 0} />
      </div>
    {/if}

    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">{t('admin.chat.participants')}</th>
            <th class="px-3 py-2">{t('admin.chat.lastMessage')}</th>
            <th class="px-3 py-2">{t('admin.chat.date')}</th>
          </tr>
        </thead>
        <tbody>
          {#each conversations as c}
            <tr class="border-t border-border">
              <td class="px-3 py-2">{(c.participants ?? []).join(', ')}</td>
              <td class="px-3 py-2 truncate max-w-md">{c.lastMessage ?? '—'}</td>
              <td class="px-3 py-2 text-xs text-gray-500 dark:text-neutral-500">{c.lastMessageAt ?? ''}</td>
            </tr>
          {:else}
            <tr><td colspan="3" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.chat.noConversations')}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50"
        disabled={chatPage <= 1}
        onclick={() => (chatPage = Math.max(1, chatPage - 1))}
      >
        ←
      </button>
      <span class="text-xs text-gray-500 dark:text-neutral-500">{chatPage} / {chatData?.totalPages ?? 1}</span>
      <button
        type="button"
        class="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50"
        disabled={chatPage >= (chatData?.totalPages ?? 1)}
        onclick={() => (chatPage = chatPage + 1)}
      >
        →
      </button>
    </div>
  {:else}
    {#if collabStats}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t('admin.chat.totalCollaborations')} value={collabStats.totalCollaborations ?? 0} />
      </div>
    {/if}

    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">{t('admin.chat.user')}</th>
            <th class="px-3 py-2">{t('admin.chat.resume')}</th>
            <th class="px-3 py-2">{t('admin.chat.collaboratorRole')}</th>
            <th class="px-3 py-2">{t('admin.chat.date')}</th>
          </tr>
        </thead>
        <tbody>
          {#each collaborations as c}
            <tr class="border-t border-border">
              <td class="px-3 py-2">{c.user ?? '—'}</td>
              <td class="px-3 py-2">{c.resume ?? '—'}</td>
              <td class="px-3 py-2">{c.role ?? '—'}</td>
              <td class="px-3 py-2 text-xs text-gray-500 dark:text-neutral-500">{c.createdAt ?? ''}</td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.chat.noCollaborations')}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50"
        disabled={collabPage <= 1}
        onclick={() => (collabPage = Math.max(1, collabPage - 1))}
      >
        ←
      </button>
      <span class="text-xs text-gray-500 dark:text-neutral-500">{collabPage} / {collabData?.totalPages ?? 1}</span>
      <button
        type="button"
        class="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50"
        disabled={collabPage >= (collabData?.totalPages ?? 1)}
        onclick={() => (collabPage = collabPage + 1)}
      >
        →
      </button>
    </div>
  {/if}
</div>
