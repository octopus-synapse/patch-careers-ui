<script lang="ts">
import { ArrowUp } from 'lucide-svelte';
import { cubicOut } from 'svelte/easing';
import { fly } from 'svelte/transition';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  count: number;
  onclick: () => void;
};

let { count, onclick }: Props = $props();

const t = $derived(locale.t);
</script>

{#if count > 0}
	<div class="sticky top-16 z-20 mt-4 flex justify-center" transition:fly={{ y: -8, duration: 180, easing: cubicOut }}>
		<button
			{onclick}
			class="flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
		>
			<ArrowUp size={14} />
			{t('feed.newPosts', { count })}
		</button>
	</div>
{/if}
