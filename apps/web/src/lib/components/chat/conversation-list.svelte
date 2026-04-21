<script lang="ts">
import { formatDate } from 'i18n';
import { Search } from 'lucide-svelte';
import { Avatar } from 'ui';
import { locale } from '$lib/state/locale.svelte';

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

type Props = {
  conversations: Conversation[];
  currentUserId?: string;
  activeConversationId?: string;
  onselect: (id: string) => void;
};

let { conversations, currentUserId, activeConversationId, onselect }: Props = $props();

let search = $state('');

const filteredConversations = $derived.by(() => {
  const q = search.trim().toLowerCase();
  if (!q) return conversations;
  return conversations.filter((c) => {
    const name = (c.participant.name ?? c.participant.username ?? '').toLowerCase();
    const last = c.lastMessage?.content.toLowerCase() ?? '';
    return name.includes(q) || last.includes(q);
  });
});

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
  return formatDate(dateStr, locale.current, { month: 'short', day: 'numeric' });
}
</script>

<div class="sticky top-0 z-10 border-b border-gray-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
	<div class="relative">
		<Search size={12} class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
		<input
			type="text"
			bind:value={search}
			placeholder="Buscar conversas"
			class="w-full rounded-md border border-gray-200 bg-transparent py-1 pl-7 pr-2 text-xs outline-none placeholder:text-gray-400 focus:border-cyan-500 dark:border-neutral-700 dark:text-neutral-200"
		/>
	</div>
</div>

{#each filteredConversations as conv}
	{@const o = other(conv)}
	{@const active = conv.id === activeConversationId}

	<button
		onclick={() => onselect(conv.id)}
		class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors
			{active ? 'bg-gray-100 dark:bg-neutral-800' : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'}"
	>
		<Avatar name={o.name ?? o.username ?? '?'} photoURL={o.photoURL} size="md" />

		<div class="min-w-0 flex-1">
			<div class="flex items-baseline justify-between gap-2">
				<span class="truncate text-xs font-semibold text-gray-800 dark:text-neutral-200">
					{o.name ?? o.username ?? 'User'}
				</span>
				{#if conv.lastMessage?.createdAt}
					<span class="flex-shrink-0 text-[10px] text-gray-500 dark:text-neutral-500">{timeAgo(conv.lastMessage.createdAt)}</span>
				{/if}
			</div>
			{#if conv.lastMessage?.content}
				<p class="truncate text-[11px] text-gray-500 dark:text-neutral-500">{conv.lastMessage.content}</p>
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
		<span class="text-xs text-gray-500 dark:text-neutral-500">no conversations</span>
	</div>
{/each}
