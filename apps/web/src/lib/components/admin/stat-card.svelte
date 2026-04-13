<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		value: string | number;
		icon?: Snippet;
	};

	let { label, value, icon }: Props = $props();
</script>

<div class="rounded-xl border p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{label}</p>
			<p class="mt-2 text-2xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">{value}</p>
		</div>
		{#if icon}
			<div class="rounded-lg p-2 bg-gray-100 dark:bg-neutral-700/50">
				{@render icon()}
			</div>
		{/if}
	</div>
</div>
