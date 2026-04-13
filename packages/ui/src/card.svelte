<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		title?: Snippet;
		class?: string;
	};

	let { children, title, class: className = '' }: Props = $props();
</script>

<div class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 {className}">
	{#if title}
		<div class="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
			{@render title()}
		</div>
	{/if}
	<div class="p-5">
		{@render children()}
	</div>
</div>
