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
	import { Button } from 'ui';
	import { Loader2, Maximize2, Minimize2, X, ArrowLeft } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';
	import { chatState } from '$lib/chat-state.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import ConversationList from './conversation-list.svelte';
	import MessageThread from './message-thread.svelte';
	import MessageInput from './message-input.svelte';
	import UserSearch from './user-search.svelte';
	import { Avatar } from 'ui';
	import { browser } from '$app/environment';

	const auth = createAuthSession(() => ({ query: { retry: false, enabled: browser } }));
	const authData = $derived(auth.data as Record<string, unknown> | undefined);
	const authenticated = $derived(authData?.authenticated ?? false);
	const currentUserId = $derived(String((authData?.user as Record<string, unknown>)?.id ?? ''));

	const conversations = createChatGetConversations(
		() => ({ limit: 50 }),
		() => ({ query: { enabled: authenticated && chatState.isOpen } })
	);

	const convListRaw = $derived(
		(conversations.data as unknown as Record<string, unknown>)?.conversations as Record<string, unknown> ?? {}
	);
	const convList = $derived((Array.isArray(convListRaw) ? convListRaw : (convListRaw as Record<string, unknown>)?.conversations as Array<Record<string, unknown>>) ?? []);

	const messages = createChatGetMessages(
		() => chatState.activeConversationId ?? '',
		() => ({ limit: 100 }),
		() => ({ query: { enabled: !!chatState.activeConversationId } })
	);

	const msgListRaw = $derived(
		(messages.data as unknown as Record<string, unknown>)?.messages as Record<string, unknown> ?? {}
	);
	const msgList = $derived((Array.isArray(msgListRaw) ? msgListRaw : (msgListRaw as Record<string, unknown>)?.messages as Array<Record<string, unknown>>) ?? []);

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
		class="fixed z-50 flex flex-col overflow-hidden shadow-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800
			transition-all duration-300 ease-out
			{chatState.isFullscreen
				? 'inset-4 rounded-xl'
				: 'bottom-0 right-4 h-[32rem] w-[22rem] rounded-t-xl'}"
	>
		<!-- Header -->
		<div class="flex flex-shrink-0 items-center justify-between border-b px-3 py-2.5 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
			<div class="flex items-center gap-2">
				{#if chatState.activeConversationId && !chatState.isFullscreen}
					<Button variant="icon" size="xs" onclick={() => chatState.setActiveConversation(null)}>
						<ArrowLeft size={16} />
					</Button>
				{/if}
				{#if activeOther && !chatState.isFullscreen}
					<a href="/@{activeOther.username}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
						<Avatar name={activeOther.name ?? activeOther.username ?? '?'} photoURL={activeOther.photoURL} size="sm" />
						<div class="min-w-0">
							<span class="block truncate text-xs font-semibold text-gray-800 dark:text-neutral-200">
								{activeOther.name ?? activeOther.username ?? 'User'}
							</span>
							{#if activeOther.username}
								<span class="block text-[10px] text-gray-500 dark:text-neutral-500">@{activeOther.username}</span>
							{/if}
						</div>
					</a>
				{:else}
					<span class="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Messages</span>
				{/if}
			</div>
			<div class="flex items-center gap-1">
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
				<div class="flex w-72 flex-shrink-0 flex-col border-r border-gray-200 dark:border-neutral-800">
					<div class="px-3 py-2">
						<UserSearch onselect={startNewConversation} />
					</div>
					<div class="flex-1 overflow-y-auto scrollbar-thin">
						<ConversationList
							conversations={convList as any}
							{currentUserId}
							activeConversationId={chatState.activeConversationId ?? undefined}
							onselect={selectConversation}
						/>
					</div>
				</div>
				<div class="flex flex-1 flex-col bg-gray-50/50 dark:bg-neutral-950/30">
					{#if chatState.activeConversationId && activeOther}
						<a href="/@{activeOther.username}" onclick={() => { if (chatState.isFullscreen) chatState.toggleFullscreen(); }} class="flex items-center gap-3 border-b px-5 py-3 transition-colors hover:opacity-80 border-gray-200 dark:border-neutral-800">
							<Avatar name={activeOther.name ?? activeOther.username ?? '?'} photoURL={activeOther.photoURL} size="lg" />
							<div class="min-w-0">
								<span class="block truncate text-sm font-semibold text-gray-800 dark:text-neutral-200">
									{activeOther.name ?? activeOther.username ?? 'User'}
								</span>
								{#if activeOther.username}
									<span class="block text-[11px] text-gray-500 dark:text-neutral-500">@{activeOther.username}</span>
								{/if}
							</div>
						</a>
						<MessageThread messages={msgList as any} {currentUserId} />
						<MessageInput disabled={sendMessage.isPending} onsend={handleSend} />
					{:else if chatState.activeConversationId}
						<MessageThread messages={msgList as any} {currentUserId} />
						<MessageInput disabled={sendMessage.isPending} onsend={handleSend} />
					{:else}
						<div class="flex flex-1 items-center justify-center">
							<span class="text-[10px] uppercase tracking-widest text-gray-500 dark:text-neutral-500">select a conversation</span>
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
								<Loader2 size={14} class="animate-spin text-gray-500 dark:text-neutral-500" />
							</div>
						{:else}
							<ConversationList
								conversations={convList as any}
								{currentUserId}
								activeConversationId={undefined}
								onselect={selectConversation}
							/>
						{/if}
					</div>
				{:else}
					<div class="flex flex-1 flex-col bg-gray-50/50 dark:bg-neutral-950/30" style="min-height:0">
						<MessageThread messages={msgList as any} {currentUserId} />
						<MessageInput disabled={sendMessage.isPending} onsend={handleSend} />
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
