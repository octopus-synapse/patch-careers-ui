<script lang="ts">
	import { Button } from 'ui';
	import { MessageCircle } from 'lucide-svelte';
	import { chatState } from '$lib/chat-state.svelte';

	type Props = {
		unreadCount?: number;
	};

	let { unreadCount = 0 }: Props = $props();
</script>

<Button
	variant="icon"
	onclick={() => chatState.toggle()}
	class="relative p-1.5 text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200"
	aria-label="Messages"
>
	<MessageCircle size={20} />
	{#if unreadCount > 0}
		<span class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
			{unreadCount > 99 ? '99+' : unreadCount}
		</span>
	{/if}
</Button>
