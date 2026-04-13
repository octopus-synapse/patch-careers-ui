<script lang="ts">
	import {
		createAuthSession,
		createChatGetConversations,
		createChatGetMessages,
		createChatSendMessage,
		createChatSendMessageToConversation,
		createChatMarkConversationAsRead,
		getChatGetConversationsQueryKey,
		getChatGetMessagesQueryKey
	} from 'api-client';
	import { customFetch } from 'api-client/client';
	import { Loader2, Maximize2, Minimize2, X, ArrowLeft } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { chatState } from '$lib/chat-state.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import ConversationList from './conversation-list.svelte';
	import MessageThread from './message-thread.svelte';
	import MessageInput from './message-input.svelte';
	import UserSearch from './user-search.svelte';
	import { Avatar } from 'ui';
	import { browser } from '$app/environment';

	const cs = $derived(colorSchema.mode);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const bg = $derived(cs === 'dark' ? 'bg-neutral-900' : 'bg-white');
	const border = $derived(cs === 'dark' ? 'border-neutral-800' : 'border-gray-200');
	const headerBg = $derived(cs === 'dark' ? 'bg-neutral-900' : 'bg-white');

	const auth = createAuthSession(() => ({ query: { retry: false, enabled: browser } }));
	const authData = $derived(auth.data?.data?.data as Record<string, unknown> | undefined);
	const authenticated = $derived(authData?.authenticated ?? false);
	const currentUserId = $derived(String((authData?.user as Record<string, unknown>)?.id ?? ''));

	const conversations = createChatGetConversations(
		() => ({ limit: 50 }),
		() => ({ query: { enabled: authenticated && chatState.isOpen } })
	);

	const convListRaw = $derived(
		(conversations.data?.data?.data as Record<string, unknown>)?.conversations as Record<string, unknown> ?? {}
	);
	const convList = $derived((convListRaw?.conversations as Array<Record<string, unknown>>) ?? []);

	const messages = createChatGetMessages(
		() => chatState.activeConversationId ?? '',
		() => ({ limit: 100 }),
		() => ({ query: { enabled: !!chatState.activeConversationId } })
	);

	const msgListRaw = $derived(
		(messages.data?.data?.data as Record<string, unknown>)?.messages as Record<string, unknown> ?? {}
	);
	const msgList = $derived((msgListRaw?.messages as Array<Record<string, unknown>>) ?? []);

	const queryClient = useQueryClient();

	const sendMessage = createChatSendMessageToConversation(() => ({
		mutation: {
			onSuccess() {
				if (chatState.activeConversationId) {
					queryClient.invalidateQueries({ queryKey: getChatGetMessagesQueryKey(chatState.activeConversationId, { limit: 100 }) });
					queryClient.invalidateQueries({ queryKey: getChatGetConversationsQueryKey({ limit: 50 }) });
				}
			}
		}
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
		} catch { /* may already exist */ }

		if (convId) chatState.setActiveConversation(convId);
		queryClient.invalidateQueries({ queryKey: getChatGetConversationsQueryKey({ limit: 50 }) });
	}

	function handleSend(content: string) {
		if (!chatState.activeConversationId) return;
		sendMessage.mutate({ conversationId: chatState.activeConversationId, data: { content } });
	}

	const activeOther = $derived.by(() => {
		if (!chatState.activeConversationId) return null;
		const conv = convList.find((c) => c.id === chatState.activeConversationId);
		if (!conv) return null;
		return conv.participant as Record<string, string> ?? null;
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
</script>

{#if chatState.isOpen && authenticated}
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
		class="fixed z-50 flex flex-col overflow-hidden shadow-2xl {bg} {border} border
			transition-all duration-300 ease-out
			{chatState.isFullscreen
				? 'inset-4 rounded-xl'
				: 'bottom-0 right-4 h-[32rem] w-[22rem] rounded-t-xl'}"
	>
		<!-- Header -->
		<div class="flex flex-shrink-0 items-center justify-between border-b px-3 py-2.5 {border} {headerBg}">
			<div class="flex items-center gap-2">
				{#if chatState.activeConversationId && !chatState.isFullscreen}
					<button onclick={() => chatState.setActiveConversation(null)} class="p-0.5 {muted} hover:opacity-70">
						<ArrowLeft size={16} />
					</button>
				{/if}
				{#if activeOther && !chatState.isFullscreen}
					<a href="/@{activeOther.username}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
						<Avatar name={activeOther.name ?? activeOther.username ?? '?'} photoURL={activeOther.photoURL} colorSchema={cs} size="sm" />
						<div class="min-w-0">
							<span class="block truncate text-xs font-semibold {text}">
								{activeOther.name ?? activeOther.username ?? 'User'}
							</span>
							{#if activeOther.username}
								<span class="block text-[10px] {muted}">@{activeOther.username}</span>
							{/if}
						</div>
					</a>
				{:else}
					<span class="text-[11px] font-bold uppercase tracking-widest {muted}">Messages</span>
				{/if}
			</div>
			<div class="flex items-center gap-1">
				<button onclick={() => chatState.toggleFullscreen()} class="p-1 {muted} hover:opacity-70">
					{#if chatState.isFullscreen}
						<Minimize2 size={14} />
					{:else}
						<Maximize2 size={14} />
					{/if}
				</button>
				<button onclick={() => chatState.close()} class="p-1 {muted} hover:opacity-70">
					<X size={14} />
				</button>
			</div>
		</div>

		{#if chatState.isFullscreen}
			<!-- Fullscreen: two-column layout -->
			<div class="flex flex-1" style="min-height:0">
				<div class="flex w-72 flex-shrink-0 flex-col border-r {border}">
					<div class="px-3 py-2">
						<UserSearch colorSchema={cs} onselect={startNewConversation} />
					</div>
					<div class="flex-1 overflow-y-auto scrollbar-thin">
						<ConversationList
							conversations={convList as any}
							{currentUserId}
							activeConversationId={chatState.activeConversationId ?? undefined}
							colorSchema={cs}
							onselect={selectConversation}
						/>
					</div>
				</div>
				<div class="flex flex-1 flex-col {cs === 'dark' ? 'bg-neutral-950/30' : 'bg-gray-50/50'}">
					{#if chatState.activeConversationId && activeOther}
						<a href="/@{activeOther.username}" onclick={() => { if (chatState.isFullscreen) chatState.toggleFullscreen(); }} class="flex items-center gap-3 border-b px-5 py-3 transition-colors hover:opacity-80 {border}">
							<Avatar name={activeOther.name ?? activeOther.username ?? '?'} photoURL={activeOther.photoURL} colorSchema={cs} size="lg" />
							<div class="min-w-0">
								<span class="block truncate text-sm font-semibold {text}">
									{activeOther.name ?? activeOther.username ?? 'User'}
								</span>
								{#if activeOther.username}
									<span class="block text-[11px] {muted}">@{activeOther.username}</span>
								{/if}
							</div>
						</a>
						<MessageThread messages={msgList as any} {currentUserId} colorSchema={cs} />
						<MessageInput colorSchema={cs} disabled={sendMessage.isPending} onsend={handleSend} />
					{:else if chatState.activeConversationId}
						<MessageThread messages={msgList as any} {currentUserId} colorSchema={cs} />
						<MessageInput colorSchema={cs} disabled={sendMessage.isPending} onsend={handleSend} />
					{:else}
						<div class="flex flex-1 items-center justify-center">
							<span class="text-[10px] uppercase tracking-widest {muted}">select a conversation</span>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Minified: single column -->
			<div class="flex flex-1 flex-col" style="min-height:0">
				{#if showConvList}
					<div class="px-3 py-2">
						<UserSearch colorSchema={cs} onselect={startNewConversation} />
					</div>
					<div class="flex-1 overflow-y-auto scrollbar-thin">
						{#if conversations.isLoading}
							<div class="flex items-center justify-center py-10">
								<Loader2 size={14} class="animate-spin {muted}" />
							</div>
						{:else}
							<ConversationList
								conversations={convList as any}
								{currentUserId}
								activeConversationId={undefined}
								colorSchema={cs}
								onselect={selectConversation}
							/>
						{/if}
					</div>
				{:else}
					<div class="flex flex-1 flex-col {cs === 'dark' ? 'bg-neutral-950/30' : 'bg-gray-50/50'}" style="min-height:0">
						<MessageThread messages={msgList as any} {currentUserId} colorSchema={cs} />
						<MessageInput colorSchema={cs} disabled={sendMessage.isPending} onsend={handleSend} />
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
