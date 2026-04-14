<script lang="ts">
	import type { Component } from 'svelte';

	type Props = {
		message: string;
		icon?: Component<{ size: number; class?: string }>;
	};

	let { message, icon }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-8 sm:py-12 gap-3">
	{#if icon}
		{@const Icon = icon}
		<Icon size={24} class="text-gray-300 dark:text-neutral-600" />
	{/if}
	<p class="text-sm text-gray-500 dark:text-neutral-500">{message}</p>
</div>
