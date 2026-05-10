<script lang="ts">
  /**
   * Admin chat & collaborations — burra: chama SDK e renderiza listas.
   */
  import {
    createGetV1AdminChatConversations,
    createGetV1AdminChatStats,
    createGetV1AdminCollaborations,
    createGetV1AdminCollaborationsStats,
  } from 'api-client';
  import { browser } from '$app/environment';
  import StatCard from '../_components/stat-card.svelte';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);

  let activeTab = $state<'chat' | 'collaborations'>('chat');
  let chatPage = $state(1);
  let collabPage = $state(1);

  const chatStatsQuery = createGetV1AdminChatStats({
      query: { enabled: browser },
    });
  const chatConversationsQuery = createGetV1AdminChatConversations(
    { page: chatPage, pageSize: 20 },
    { query: { enabled: browser && activeTab === 'chat' } },
  );
  const collabStatsQuery = createGetV1AdminCollaborationsStats({
      query: { enabled: browser },
    });
  const collabListQuery = createGetV1AdminCollaborations(
    { page: collabPage, pageSize: 20 },
    { query: { enabled: browser && activeTab === 'collaborations' } },
  );

  const chatStats = $derived($chatStatsQuery.data);
  const chatData = $derived($chatConversationsQuery.data);
  const collabStats = $derived($collabStatsQuery.data);
  const collabData = $derived($collabListQuery.data);
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
        <StatCard label={t('admin.chat.totalConversations')} value={chatStats.totalConversations} />
        <StatCard label={t('admin.chat.totalMessages')} value={chatStats.totalMessages} />
        <StatCard label={t('admin.chat.activeUsers')} value={chatStats.activeChatUsers} />
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
          {#if chatData && chatData.items.length > 0}
            {#each chatData.items as c}
              <tr class="border-t border-border">
                <td class="px-3 py-2">{[c.participant1.name ?? c.participant1.email, c.participant2.name ?? c.participant2.email].join(', ')}</td>
                <td class="px-3 py-2 truncate max-w-md">{c.lastMessageContent ?? '—'}</td>
                <td class="px-3 py-2 text-xs text-gray-500 dark:text-neutral-500">{c.lastMessageAt ?? ''}</td>
              </tr>
            {/each}
          {:else}
            <tr><td colspan="3" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.chat.noConversations')}</td></tr>
          {/if}
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
        <StatCard label={t('admin.chat.totalCollaborations')} value={collabStats.totalCollaborations} />
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
          {#if collabData && collabData.items.length > 0}
            {#each collabData.items as c}
              <tr class="border-t border-border">
                <td class="px-3 py-2">{c.user.name ?? c.user.email}</td>
                <td class="px-3 py-2">{c.resume.title ?? '—'}</td>
                <td class="px-3 py-2">{c.role}</td>
                <td class="px-3 py-2 text-xs text-gray-500 dark:text-neutral-500">{c.invitedAt}</td>
              </tr>
            {/each}
          {:else}
            <tr><td colspan="4" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.chat.noCollaborations')}</td></tr>
          {/if}
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
