<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createAuthSession,
  createChatGetConversations,
  createChatGetMessages,
  createChatMarkConversationAsRead,
  createChatSendMessage,
  createChatSendMessageToConversation,
  getChatGetConversationsQueryKey,
  getChatGetMessagesQueryKey,
} from 'api-client';
import { ArrowLeft, Maximize2, Minimize2, MoreHorizontal, X } from 'lucide-svelte';
import { fade, fly } from 'svelte/transition';
import { Avatar, Button, Dropdown, Loader } from 'ui';
import { browser } from '$app/environment';
import { chatState } from '$lib/state/chat-state.svelte';
import BlockMenuItem from '$lib/components/moderation/block-menu-item.svelte';
import ConversationList from './conversation-list.svelte';
import MessageInput from './message-input.svelte';
import MessageThread from './message-thread.svelte';
import UserSearch from './user-search.svelte';

const auth = createAuthSession(() => ({ query: { retry: false, enabled: browser } }));
const authenticated = $derived(auth.data?.authenticated);
const currentUserId = $derived(String(auth.data?.user?.id));
// Same 3-stage gate as the FAB — chat UI stays unmounted + queries
// disabled until the user is verified AND onboarded.
const canUseApp = $derived(
  Boolean(authenticated) &&
    !(auth.data?.user?.needsEmailVerification ?? false) &&
    !(auth.data?.user?.needsOnboarding ?? false),
);

const conversations = createChatGetConversations(
  () => ({ limit: 50 }),
  () => ({ query: { enabled: canUseApp && chatState.isOpen } }),
);

type Conversation = {
  id: string;
  participant: {
    id: string;
    name: string | null;
    photoURL: string | null;
    username: string | null;
  };
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

const convList = $derived(
  (conversations.data?.conversations?.conversations ?? []) as Conversation[],
);

const messages = createChatGetMessages(
  () => chatState.activeConversationId ?? '',
  () => ({ limit: 100 }),
  () => ({ query: { enabled: !!chatState.activeConversationId } }),
);

const msgList = $derived((messages.data?.messages?.messages ?? []) as Message[]);

const queryClient = useQueryClient();

const sendMessage = createChatSendMessageToConversation(() => ({
  mutation: {
    onSuccess() {
      if (chatState.activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: getChatGetMessagesQueryKey(chatState.activeConversationId, { limit: 100 }),
        });
        queryClient.invalidateQueries({ queryKey: getChatGetConversationsQueryKey({ limit: 50 }) });
      }
    },
  },
}));

const markRead = createChatMarkConversationAsRead();
const startConversation = createChatSendMessage();

function selectConversation(id: string) {
  chatState.setActiveConversation(id);
  markRead.mutate({ conversationId: id });
}

async function startNewConversation(recipientId: string) {
  let convId: string | null = null;
  try {
    const res = await startConversation.mutateAsync({ data: { recipientId, content: '👋' } });
    const json = JSON.stringify(res);
    const match = json.match(/"conversationId"\s*:\s*"([^"]+)"/);
    convId = match?.[1] ?? null;
  } catch {
    /* may already exist */
  }

  if (convId) chatState.setActiveConversation(convId);
  queryClient.invalidateQueries({ queryKey: getChatGetConversationsQueryKey({ limit: 50 }) });
}

function handleSend(content: string) {
  if (!chatState.activeConversationId) return;
  sendMessage.mutate({ conversationId: chatState.activeConversationId, data: { content } });
}

const activeOther = $derived.by(() => {
  if (!chatState.activeConversationId) return null;
  const conv = convList?.find((c) => c.id === chatState.activeConversationId);
  if (!conv) return null;
  return conv.participant;
});

// Handle pending recipient (from profile "Message" button)
$effect(() => {
  if (chatState.pendingRecipientId && chatState.isOpen) {
    const rid = chatState.pendingRecipientId;
    chatState.clearPendingRecipient();
    startNewConversation(rid);
  }
});

const showConvList = $derived(!chatState.activeConversationId);
let chatMenuOpen = $state(false);

// Draggable position — desktop only, persisted in localStorage. Fullscreen
// and mobile ignore the offset.
const POS_STORAGE_KEY = 'patch:chatWidgetPos';
let dragOffsetX = $state(0);
let dragOffsetY = $state(0);
let isDragging = $state(false);
let dragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };

$effect(() => {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(POS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { x?: number; y?: number };
      dragOffsetX = Number(parsed.x) || 0;
      dragOffsetY = Number(parsed.y) || 0;
    }
  } catch {
    /* corrupted storage — ignore */
  }
});

function onDragStart(e: PointerEvent) {
  if (chatState.isFullscreen) return;
  if (typeof window !== 'undefined' && window.innerWidth < 640) return;
  // Only initiate drag when the user presses the header background itself —
  // clicks on child controls (close, fullscreen, menu trigger, avatar link)
  // would otherwise steal their pointer events via setPointerCapture.
  const target = e.target as HTMLElement | null;
  if (target && target !== e.currentTarget && target.closest('button, a')) return;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY, offsetX: dragOffsetX, offsetY: dragOffsetY };
}

function onDragMove(e: PointerEvent) {
  if (!isDragging) return;
  dragOffsetX = dragStart.offsetX + (dragStart.x - e.clientX);
  dragOffsetY = dragStart.offsetY + (dragStart.y - e.clientY);
}

function onDragEnd(e: PointerEvent) {
  if (!isDragging) return;
  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  isDragging = false;
  try {
    window.localStorage.setItem(
      POS_STORAGE_KEY,
      JSON.stringify({ x: dragOffsetX, y: dragOffsetY }),
    );
  } catch {
    /* storage full — ignore */
  }
}
</script>

{#if chatState.isOpen && canUseApp}
	<!-- Backdrop for fullscreen -->
	{#if chatState.isFullscreen}
		<div
			class="fixed inset-0 z-40 bg-black/50"
			transition:fade={{ duration: 200 }}
			onclick={() => chatState.close()}
			role="presentation"
		></div>
	{/if}

	<div
		transition:fly={{ y: 40, duration: 250 }}
		style:--chat-drag-x="{chatState.isFullscreen ? 0 : dragOffsetX}px"
		style:--chat-drag-y="{chatState.isFullscreen ? 0 : dragOffsetY}px"
		style:transform="translate(calc(-1 * var(--chat-drag-x)), calc(-1 * var(--chat-drag-y)))"
		class="fixed z-50 flex flex-col overflow-hidden shadow-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800
			{isDragging ? '' : 'transition-all duration-300 ease-out'}
			{chatState.isFullscreen
				? 'inset-0 sm:inset-y-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-[70vw] sm:max-w-6xl rounded-none sm:rounded-xl'
				: 'bottom-0 right-0 sm:right-4 h-[100dvh] sm:h-[32rem] w-full sm:w-[22rem] rounded-none sm:rounded-t-xl'}"
	>
		<!-- Header (drag handle on desktop; purely pointer-driven, no keyboard-equivalent) -->
		<div
			role="toolbar"
			tabindex="-1"
			aria-label="Chat window header"
			class="flex flex-shrink-0 items-center justify-between border-b px-3 py-2.5 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 {chatState.isFullscreen ? '' : 'sm:cursor-move'}"
			onpointerdown={onDragStart}
			onpointermove={onDragMove}
			onpointerup={onDragEnd}
			onpointercancel={onDragEnd}
		>
			<div class="flex items-center gap-2">
				{#if chatState.activeConversationId && !chatState.isFullscreen}
					<Button variant="icon" size="xs" onclick={() => chatState.setActiveConversation(null)}>
						<ArrowLeft size={16} />
					</Button>
				{/if}
				{#if activeOther && !chatState.isFullscreen}
					{@const profileHref = activeOther.username
						? `/my-profile/public/@${activeOther.username}`
						: undefined}
					<svelte:element
						this={profileHref ? 'a' : 'div'}
						href={profileHref}
						class="flex items-center gap-2 {profileHref ? 'hover:opacity-80 transition-opacity' : ''}"
					>
						<Avatar name={activeOther.name ?? activeOther.username ?? '?'} photoURL={activeOther.photoURL} size="sm" />
						<div class="min-w-0">
							<span class="block truncate text-xs font-semibold text-gray-800 dark:text-neutral-200">
								{activeOther.name ?? activeOther.username ?? 'User'}
							</span>
							{#if activeOther.username}
								<span class="block text-[10px] text-gray-500 dark:text-neutral-500">@{activeOther.username}</span>
							{/if}
						</div>
					</svelte:element>
				{:else}
					<span class="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Messages</span>
				{/if}
			</div>
			<div class="flex items-center gap-1">
				{#if activeOther}
					<Dropdown open={chatMenuOpen} align="right" onclose={() => (chatMenuOpen = false)}>
						{#snippet trigger()}
							<Button variant="icon" size="xs" onclick={() => (chatMenuOpen = !chatMenuOpen)}>
								<MoreHorizontal size={14} />
							</Button>
						{/snippet}
						<BlockMenuItem
							targetUserId={String(activeOther.id)}
							targetName={String(activeOther.name ?? activeOther.username ?? '')}
							source="chat_widget"
							onbeforeConfirm={() => (chatMenuOpen = false)}
						/>
					</Dropdown>
				{/if}
				<Button variant="icon" size="xs" onclick={() => chatState.toggleFullscreen()}>
					{#if chatState.isFullscreen}
						<Minimize2 size={14} />
					{:else}
						<Maximize2 size={14} />
					{/if}
				</Button>
				<Button variant="icon" size="xs" onclick={() => chatState.close()}>
					<X size={14} />
				</Button>
			</div>
		</div>

		{#if chatState.isFullscreen}
			<!-- Fullscreen: two-column layout -->
			<div class="flex flex-1" style="min-height:0">
				<div class="hidden sm:flex w-72 flex-shrink-0 flex-col border-r border-gray-200 dark:border-neutral-800">
					<div class="px-3 py-2">
						<UserSearch onselect={startNewConversation} />
					</div>
					<div class="flex-1 overflow-y-auto scrollbar-thin">
						<ConversationList
							conversations={convList}
							{currentUserId}
							activeConversationId={chatState.activeConversationId ?? undefined}
							onselect={selectConversation}
						/>
					</div>
				</div>
				<div class="flex flex-1 flex-col bg-gray-50/50 dark:bg-neutral-950/30">
					{#if chatState.activeConversationId && activeOther}
						{@const fullscreenProfileHref = activeOther.username
							? `/my-profile/public/@${activeOther.username}`
							: undefined}
						{#snippet headerContent()}
							<Avatar name={activeOther.name ?? activeOther.username ?? '?'} photoURL={activeOther.photoURL} size="lg" />
							<div class="min-w-0">
								<span class="block truncate text-sm font-semibold text-gray-800 dark:text-neutral-200">
									{activeOther.name ?? activeOther.username ?? 'User'}
								</span>
								{#if activeOther.username}
									<span class="block text-[11px] text-gray-500 dark:text-neutral-500">@{activeOther.username}</span>
								{/if}
							</div>
						{/snippet}
						{#if fullscreenProfileHref}
							<a
								href={fullscreenProfileHref}
								onclick={() => { if (chatState.isFullscreen) chatState.toggleFullscreen(); }}
								class="flex items-center gap-3 border-b px-5 py-3 border-gray-200 dark:border-neutral-800 transition-colors hover:opacity-80"
							>
								{@render headerContent()}
							</a>
						{:else}
							<div class="flex items-center gap-3 border-b px-5 py-3 border-gray-200 dark:border-neutral-800">
								{@render headerContent()}
							</div>
						{/if}
						<MessageThread messages={msgList} {currentUserId} />
						<MessageInput disabled={sendMessage.isPending} onsend={handleSend} />
					{:else if chatState.activeConversationId}
						<MessageThread messages={msgList} {currentUserId} />
						<MessageInput disabled={sendMessage.isPending} onsend={handleSend} />
					{:else}
						<div class="flex flex-1 items-center justify-center">
							<span class="text-xs text-gray-500 dark:text-neutral-500">select a conversation</span>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Minified: single column -->
			<div class="flex flex-1 flex-col" style="min-height:0">
				{#if showConvList}
					<div class="px-3 py-2">
						<UserSearch onselect={startNewConversation} />
					</div>
					<div class="flex-1 overflow-y-auto scrollbar-thin">
						{#if conversations.isLoading}
							<div class="flex items-center justify-center py-10">
								<Loader size={14} />
							</div>
						{:else}
							<ConversationList
								conversations={convList}
								{currentUserId}
								activeConversationId={undefined}
								onselect={selectConversation}
							/>
						{/if}
					</div>
				{:else}
					<div class="flex flex-1 flex-col bg-gray-50/50 dark:bg-neutral-950/30" style="min-height:0">
						<MessageThread messages={msgList} {currentUserId} />
						<MessageInput disabled={sendMessage.isPending} onsend={handleSend} />
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
