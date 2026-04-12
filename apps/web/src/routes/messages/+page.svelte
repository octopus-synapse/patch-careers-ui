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
	import { Loader2, MessageSquare } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Avatar } from 'ui';
	import { customFetch } from 'api-client/client';
	import ConversationList from '$lib/components/chat/conversation-list.svelte';
	import MessageThread from '$lib/components/chat/message-thread.svelte';
	import MessageInput from '$lib/components/chat/message-input.svelte';
	import UserSearch from '$lib/components/chat/user-search.svelte';

	const cs = $derived(colorSchema.mode);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const border = $derived(cs === 'dark' ? 'border-neutral-800' : 'border-gray-200');

	const auth = createAuthSession(() => ({ query: { retry: false } }));
	const authenticated = $derived(auth.data?.data?.data?.authenticated ?? false);
	const authData = $derived(auth.data?.data?.data as Record<string, unknown> | undefined);
	const currentUserId = $derived(String((authData?.user as Record<string, unknown>)?.id ?? authData?.userId ?? ''));

	$effect(() => {
		if (!auth.isLoading && !authenticated) goto('/login');
	});

	const conversations = createChatGetConversations(
		() => ({ limit: 50 }),
		() => ({ query: { enabled: authenticated } })
	);

	const convListRaw = $derived(
		(conversations.data?.data?.data as Record<string, unknown>)?.conversations as Record<string, unknown> ?? {}
	);
	const convList = $derived(
		(convListRaw?.conversations as Array<Record<string, unknown>>) ?? []
	);

	let activeConvId = $state<string | null>(null);

	const messages = createChatGetMessages(
		() => activeConvId ?? '',
		() => ({ limit: 100 }),
		() => ({ query: { enabled: !!activeConvId } })
	);

	const msgListRaw = $derived(
		(messages.data?.data?.data as Record<string, unknown>)?.messages as Record<string, unknown> ?? {}
	);
	const msgList = $derived(
		(msgListRaw?.messages as Array<Record<string, unknown>>) ?? []
	);

	const queryClient = useQueryClient();

	const sendMessage = createChatSendMessageToConversation(() => ({
		mutation: {
			onSuccess() {
				if (activeConvId) {
					queryClient.invalidateQueries({ queryKey: getChatGetMessagesQueryKey(activeConvId, { limit: 100 }) });
					queryClient.invalidateQueries({ queryKey: getChatGetConversationsQueryKey({ limit: 50 }) });
				}
			}
		}
	}));

	const markRead = createChatMarkConversationAsRead();

	const startConversation = createChatSendMessage(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getChatGetConversationsQueryKey({ limit: 50 }) });
			}
		}
	}));

	function selectConversation(id: string) {
		activeConvId = id;
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
			// conversation may already exist
		}

		if (convId) {
			activeConvId = convId;
		}

		queryClient.invalidateQueries({ queryKey: getChatGetConversationsQueryKey({ limit: 50 }) });
	}

	function handleSend(content: string) {
		if (!activeConvId) return;
		sendMessage.mutate({ conversationId: activeConvId, data: { content } });
	}

	const activeOther = $derived.by(() => {
		if (!activeConvId) return null;
		const conv = convList.find((c) => c.id === activeConvId);
		if (!conv) return null;
		return conv.participant as Record<string, string> ?? null;
	});
</script>

<svelte:head>
	<title>Messages</title>
</svelte:head>

{#if auth.isLoading}
	<div class="flex h-screen items-center justify-center">
		<Loader2 size={20} class="animate-spin {muted}" />
	</div>
{:else}
	<div class="flex h-screen pt-16">
		<div class="mx-auto flex w-full max-w-5xl">

			<!-- Left: Conversations -->
			<div class="flex w-72 flex-shrink-0 flex-col border-r {border}">
				<div class="px-4 pb-3 pt-6">
					<h1 class="text-[10px] font-bold uppercase tracking-widest {muted}">Messages</h1>
				</div>

				<div class="px-4 pb-3">
					<UserSearch colorSchema={cs} onselect={startNewConversation} />
				</div>

				<div class="flex-1 overflow-y-auto">
					{#if conversations.isLoading}
						<div class="flex items-center justify-center py-16">
							<Loader2 size={14} class="animate-spin {muted}" />
						</div>
					{:else}
						<ConversationList
							conversations={convList as any}
							{currentUserId}
							activeConversationId={activeConvId ?? undefined}
							colorSchema={cs}
							onselect={selectConversation}
						/>
					{/if}
				</div>
			</div>

			<!-- Right: Thread -->
			<div class="flex flex-1 flex-col {cs === 'dark' ? 'bg-neutral-950/30' : 'bg-gray-50/50'}">
				{#if activeConvId}
					{#if activeOther}
					<div class="flex items-center gap-3 border-b px-5 py-3 {border}">
						<Avatar name={activeOther.displayName ?? activeOther.name ?? activeOther.username ?? '?'} colorSchema={cs} size="sm" />
						<div>
							<span class="text-sm font-semibold {text}">
								{activeOther.displayName ?? activeOther.name ?? activeOther.username ?? 'User'}
							</span>
							{#if activeOther.username}
								<span class="ml-2 text-[11px] {muted}">@{activeOther.username}</span>
							{/if}
						</div>
					</div>
					{/if}

					{#if messages.isLoading}
					<div class="flex flex-1 items-center justify-center">
						<Loader2 size={14} class="animate-spin {muted}" />
					</div>
					{:else}
					<MessageThread messages={msgList as any} {currentUserId} colorSchema={cs} />
					{/if}

					<MessageInput colorSchema={cs} disabled={sendMessage.isPending} onsend={handleSend} />
				{:else}
					<div class="flex flex-1 flex-col items-center justify-center gap-2">
						<MessageSquare size={28} class={muted} />
						<span class="text-[10px] uppercase tracking-widest {muted}">select a conversation</span>
					</div>
				{/if}
			</div>

		</div>
	</div>
{/if}
