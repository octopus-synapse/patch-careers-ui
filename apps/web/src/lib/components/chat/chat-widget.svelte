<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { onDestroy } from 'svelte';
import {
  postV1ChatMessages,
  createGetV1ChatConversations,
  createPostV1ChatConversationsConversationIdRead,
  getV1ChatConversationsQueryKey,
} from 'api-client';
import { ArrowLeft, Maximize2, Minimize2, MoreHorizontal, X } from 'lucide-svelte';
import { fade, fly } from 'svelte/transition';
import { Avatar, Button, Dropdown, Loader } from 'ui';
import { useAuth } from '$lib/state/auth.svelte';
import { chatState } from '$lib/state/chat-state.svelte';
import { locale } from '$lib/state/locale.svelte';
import BlockMenuItem from '$lib/components/moderation/block-menu-item.svelte';
import ChatThreadPane from './chat-thread-pane.svelte';
import ConversationList from './conversation-list.svelte';
import UserSearch from './user-search.svelte';

const t = $derived(locale.t);

/**
 * Floating chat widget — frontend-burro renderer for the conversation
 * inbox. Backend stays the source of truth for participant/message metadata.
 */

const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated);
const currentUserId = $derived(String(auth.userId ?? ''));
const canUseApp = $derived(
  Boolean(authenticated) &&
    !(auth.needsEmailVerification ?? false) &&
    !(auth.needsOnboarding ?? false),
);

const conversations = createGetV1ChatConversations(
  { limit: 50 },
  { query: { enabled: () => canUseApp && chatState.isOpen } },
);

const convList = $derived($conversations.data?.items);

// The per-conversation messages query + send mutation live in
// `chat-thread-pane.svelte`, mounted below under `{#key conversationId}`
// so a conversation switch destroys and re-creates the query — the
// only way to escape the kubb wrapper's one-shot `readable()` of the
// positional conversationId. Same family of fix as feed-content +
// user-search-results.

const queryClient = useQueryClient();

const markRead = createPostV1ChatConversationsConversationIdRead();

function selectConversation(id: string) {
  chatState.setActiveConversation(id);
  $markRead.mutate({ conversationId: id });
}

async function startNewConversation(recipientId: string) {
  let convId: string | null = null;
  try {
    // POST /api/v1/chat/messages — kicks off (or reuses) a 1:1 conversation
    // with `recipientId`. Backend returns the message envelope including the
    // conversation id.
    const res = await postV1ChatMessages({ recipientId, content: '👋' });
    convId = res.message.conversationId;
  } catch {
    /* may already exist */
  }

  if (convId) chatState.setActiveConversation(convId);
  queryClient.invalidateQueries({ queryKey: getV1ChatConversationsQueryKey({ limit: 50 }) });
}

const activeOther = $derived.by(() => {
  if (!chatState.activeConversationId || !convList) return null;
  const conv = convList.find((c) => c.id === chatState.activeConversationId);
  return conv?.participant ?? null;
});

// Handle pending recipient (from profile "Message" button)
$effect(() => {
  if (chatState.pendingRecipientId && chatState.isOpen) {
    const rid = chatState.pendingRecipientId;
    chatState.clearPendingRecipient();
    void startNewConversation(rid);
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
// P2-#52: track the element currently holding pointer capture so an
// unmount mid-drag releases it instead of leaving a captured pointer
// that no longer has a listener. Without this the window keeps
// dispatching pointermove to a destroyed component.
let dragCaptureEl: HTMLElement | null = null;
let dragCapturePointerId: number | null = null;

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
  const handle = e.currentTarget as HTMLElement;
  handle.setPointerCapture(e.pointerId);
  dragCaptureEl = handle;
  dragCapturePointerId = e.pointerId;
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
  dragCaptureEl = null;
  dragCapturePointerId = null;
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

// P2-#52: if the user closes the chat-widget mid-drag the component is
// torn down without `onDragEnd` ever firing. Release the captured
// pointer on destroy so the browser doesn't keep dispatching events to
// a vanished listener (which manifested as the UI freezing).
onDestroy(() => {
  if (dragCaptureEl && dragCapturePointerId !== null) {
    try {
      dragCaptureEl.releasePointerCapture(dragCapturePointerId);
    } catch {
      /* element already detached — ignore */
    }
    dragCaptureEl = null;
    dragCapturePointerId = null;
  }
});
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
			aria-label={t('chat.windowHeaderAria')}
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
			<div class="flex flex-1 min-h-0">
				<div class="hidden sm:flex w-72 flex-shrink-0 flex-col border-r border-gray-200 dark:border-neutral-800">
					<div class="px-3 py-2">
						<UserSearch onselect={startNewConversation} />
					</div>
					<div class="flex-1 overflow-y-auto scrollbar-thin">
						{#if convList}
							<ConversationList
								conversations={convList}
								{currentUserId}
								activeConversationId={chatState.activeConversationId || undefined}
								onselect={selectConversation}
							/>
						{/if}
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
						{#if chatState.activeConversationId}
							{#key chatState.activeConversationId}
								<ChatThreadPane conversationId={chatState.activeConversationId} {currentUserId} />
							{/key}
						{/if}
					{:else if chatState.activeConversationId}
						{#key chatState.activeConversationId}
							<ChatThreadPane conversationId={chatState.activeConversationId} {currentUserId} />
						{/key}
					{:else}
						<div class="flex flex-1 items-center justify-center">
							<span class="text-xs text-gray-500 dark:text-neutral-500">select a conversation</span>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Minified: single column -->
			<div class="flex flex-1 flex-col min-h-0">
				{#if showConvList}
					<div class="px-3 py-2">
						<UserSearch onselect={startNewConversation} />
					</div>
					<div class="flex-1 overflow-y-auto scrollbar-thin">
						{#if $conversations.isLoading}
							<div class="flex items-center justify-center py-10">
								<Loader size={14} />
							</div>
						{:else if convList}
							<ConversationList
								conversations={convList}
								{currentUserId}
								activeConversationId={undefined}
								onselect={selectConversation}
							/>
						{/if}
					</div>
				{:else}
					<div class="flex flex-1 flex-col bg-gray-50/50 dark:bg-neutral-950/30 min-h-0">
						{#if chatState.activeConversationId}
							{#key chatState.activeConversationId}
								<ChatThreadPane conversationId={chatState.activeConversationId} {currentUserId} />
							{/key}
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
