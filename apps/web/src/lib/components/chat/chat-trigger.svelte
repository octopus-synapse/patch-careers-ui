<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { MessageCircle } from 'lucide-svelte';
	import { chatState } from '$lib/chat-state.svelte';

	type Props = {
		unreadCount?: number;
		colorSchema?: ColorSchema;
	};

	let { unreadCount = 0, colorSchema = 'light' }: Props = $props();

	const text = $derived(colorSchema === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-gray-500 hover:text-gray-800');
</script>

<button
	onclick={() => chatState.toggle()}
	class="relative p-1.5 transition-colors {text}"
	aria-label="Messages"
>
	<MessageCircle size={20} />
	{#if unreadCount > 0}
		<span class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
			{unreadCount > 99 ? '99+' : unreadCount}
		</span>
	{/if}
</button>
