<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { colorSchema } from '$lib/color-schema.svelte';
</script>

<button
	onclick={colorSchema.toggle}
	class="rounded-lg p-2 transition-colors text-gray-500 hover:bg-gray-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
	aria-label="Toggle color schema"
>
	{#if colorSchema.mode === 'dark'}
		<Sun size={18} />
	{:else}
		<Moon size={18} />
	{/if}
</button>
