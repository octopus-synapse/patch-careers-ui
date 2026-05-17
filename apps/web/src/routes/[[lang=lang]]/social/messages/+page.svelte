<!--
  Dedicated /messages route. Reuses the existing chat components but renders
  them in a persistent, full-screen two-pane layout with a URL that survives
  reloads. Frontend-burro: backend remains the source of truth for
  conversation/message metadata; we only cast the `void` swagger responses
  to the documented runtime shapes at the boundary.
-->
<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1ChatConversations,
  createGetV1ChatConversationsConversationIdMessages,
  createPostV1ChatConversationsConversationIdMessages,
  createPostV1ChatConversationsConversationIdRead,
  getV1ChatConversationsQueryKey,
  getV1ChatConversationsConversationIdMessagesQueryKey,
} from 'api-client';
import { Loader } from 'ui';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import ConversationList from '$lib/components/chat/conversation-list.svelte';
import MessageInput from '$lib/components/chat/message-input.svelte';
import MessageThread from '$lib/components/chat/message-thread.svelte';
import UserSearch from '$lib/components/chat/user-search.svelte';
import { useAuth } from '$lib/state/auth.svelte';

type ConversationParticipant = {
  id: string;
  name: string | null;
  photoURL: string | null;
  username: string | null;
};

type Conversation = {
  id: string;
  participant: ConversationParticipant;
  lastMessage: { content: string; senderId: string; createdAt: string; isRead: boolean } | null;
  unreadCount?: number;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  sender: { id: string; name: string | null; photoURL: string | null };
};

type ConversationsResponse = {
  items?: Conversation[];
  conversations?: { conversations?: Conversation[] } | Conversation[];
};

type MessagesResponse = {
  items?: Message[];
  messages?: { messages?: Message[] } | Message[];
};

function extractConversations(data: ConversationsResponse | undefined): Conversation[] {
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  const inner = data.conversations;
  if (Array.isArray(inner)) return inner;
  if (inner && Array.isArray(inner.conversations)) return inner.conversations;
  return [];
}

function extractMessages(data: MessagesResponse | undefined): Message[] {
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  const inner = data.messages;
  if (Array.isArray(inner)) return inner;
  if (inner && Array.isArray(inner.messages)) return inner.messages;
  return [];
}

const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated);
const currentUserId = $derived(String(auth.userId ?? ''));

$effect(() => {
  if (!auth.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

const activeId = $derived($page.url.searchParams.get('c'));

const conversations = createGetV1ChatConversations(
  { limit: 50 },
  { query: { enabled: () => Boolean(authenticated) } },
);
const convList = $derived(extractConversations($conversations.data));

// svelte-ignore state_referenced_locally
const messages = createGetV1ChatConversationsConversationIdMessages(
  activeId ?? undefined,
  { limit: 100 },
  { query: { enabled: () => Boolean(activeId) } },
);
const msgList = $derived(extractMessages($messages.data));

const queryClient = useQueryClient();

const markRead = createPostV1ChatConversationsConversationIdRead();
const sendMessage = createPostV1ChatConversationsConversationIdMessages({
  mutation: {
    onSuccess() {
      if (activeId) {
        queryClient.invalidateQueries({
          queryKey: getV1ChatConversationsConversationIdMessagesQueryKey(activeId, { limit: 100 }),
        });
        queryClient.invalidateQueries({
          queryKey: getV1ChatConversationsQueryKey({ limit: 50 }),
        });
      }
    },
  },
});

function select(id: string) {
  $markRead.mutate({ conversationId: id });
  const params = new URLSearchParams($page.url.searchParams);
  params.set('c', id);
  goto(`/messages?${params.toString()}`, { replaceState: true, noScroll: true });
}

function handleSend(content: string) {
  if (!activeId) return;
  $sendMessage.mutate({ conversationId: activeId, data: { content } });
}

const activeOther = $derived.by(() => {
  if (!activeId) return null;
  const conv = convList.find((c) => c.id === activeId);
  return conv?.participant ?? null;
});
</script>

<svelte:head>
  <title>Mensagens · Patch Careers</title>
</svelte:head>

<div class="mx-auto grid h-[calc(100vh-5rem)] max-w-6xl grid-cols-1 pt-20 md:grid-cols-[320px_1fr]">
  <aside class="flex flex-col border-r border-gray-200 dark:border-neutral-800">
    <div class="border-b border-gray-200 px-3 py-2 dark:border-neutral-800">
      <UserSearch onselect={select} />
    </div>
    <div class="flex-1 overflow-y-auto scrollbar-thin">
      {#if $conversations.isLoading}
        <div class="flex items-center justify-center py-10">
          <Loader size={16} />
        </div>
      {:else}
        <ConversationList
          conversations={convList}
          {currentUserId}
          activeConversationId={activeId ?? undefined}
          onselect={select}
        />
      {/if}
    </div>
  </aside>

  <section class="flex flex-col bg-gray-50/50 dark:bg-neutral-950/30 min-h-0">
    {#if activeId}
      {#if activeOther}
        <header class="flex items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-neutral-800">
          <img
            src={activeOther.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(activeOther.name ?? activeOther.username ?? '?')}`}
            alt=""
            class="h-9 w-9 rounded-full"
          />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-gray-800 dark:text-neutral-200">
              {activeOther.name ?? activeOther.username ?? 'User'}
            </p>
            {#if activeOther.username}
              <p class="text-[11px] text-gray-500 dark:text-neutral-500">@{activeOther.username}</p>
            {/if}
          </div>
        </header>
      {/if}
      {#key activeId}
        <MessageThread messages={msgList} {currentUserId} />
      {/key}
      <MessageInput disabled={$sendMessage.isPending} onsend={handleSend} />
    {:else}
      <div
        class="flex h-full items-center justify-center text-sm text-gray-500 dark:text-neutral-500"
        role="status"
      >
        Selecione uma conversa para ver as mensagens.
      </div>
    {/if}
  </section>
</div>
