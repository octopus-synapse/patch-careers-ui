<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { Avatar } from 'ui';

	type Conversation = {
		id: string;
		participant: { id: string; displayName: string | null; photoURL: string | null; username: string | null; name?: string | null };
		lastMessage: { content: string; senderId: string; createdAt: string; isRead: boolean } | null;
		unreadCount?: number;
	};

	type Props = {
		conversations: Conversation[];
		currentUserId?: string;
		activeConversationId?: string;
		colorSchema?: ColorSchema;
		onselect: (id: string) => void;
	};

	let { conversations, currentUserId, activeConversationId, colorSchema = 'light', onselect }: Props = $props();

	const text = $derived(colorSchema === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const activeBg = $derived(colorSchema === 'dark' ? 'bg-neutral-800' : 'bg-gray-100');
	const hoverBg = $derived(colorSchema === 'dark' ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50');

	function other(conv: Conversation) {
		return conv.participant;
	}

	function timeAgo(dateStr: string | null): string {
		if (!dateStr) return '';
		const ms = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(ms / 60000);
		if (mins < 1) return 'now';
		if (mins < 60) return `${mins}m`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h`;
		const days = Math.floor(hrs / 24);
		if (days < 7) return `${days}d`;
		return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

{#each conversations as conv}
	{@const o = other(conv)}
	{@const active = conv.id === activeConversationId}

	<button
		onclick={() => onselect(conv.id)}
		class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors
			{active ? activeBg : hoverBg}"
	>
		<Avatar name={o.displayName ?? o.name ?? o.username ?? '?'} {colorSchema} size="md" />

		<div class="min-w-0 flex-1">
			<div class="flex items-baseline justify-between gap-2">
				<span class="truncate text-xs font-semibold {text}">
					{o.displayName ?? o.name ?? o.username ?? 'User'}
				</span>
				{#if conv.lastMessage?.createdAt}
					<span class="flex-shrink-0 text-[10px] {muted}">{timeAgo(conv.lastMessage.createdAt)}</span>
				{/if}
			</div>
			{#if conv.lastMessage?.content}
				<p class="truncate text-[11px] {muted}">{conv.lastMessage.content}</p>
			{/if}
		</div>

		{#if conv.unreadCount && conv.unreadCount > 0}
			<span class="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
				{conv.unreadCount > 99 ? '99+' : conv.unreadCount}
			</span>
		{/if}
	</button>
{:else}
	<div class="flex items-center justify-center py-16">
		<span class="text-[10px] uppercase tracking-widest {muted}">no conversations</span>
	</div>
{/each}
