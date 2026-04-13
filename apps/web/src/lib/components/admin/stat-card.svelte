<script lang="ts">
	import type { ColorSchema } from 'ui';
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		value: string | number;
		colorSchema?: ColorSchema;
		icon?: Snippet;
	};

	let { label, value, colorSchema = 'light', icon }: Props = $props();

	const cs = $derived(colorSchema);
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const iconBg = $derived(cs === 'dark' ? 'bg-neutral-700/50' : 'bg-gray-100');
</script>

<div class="rounded-xl border p-5 {cardBg} {cardBorder}">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-[10px] font-bold uppercase tracking-widest {muted}">{label}</p>
			<p class="mt-2 text-2xl font-semibold tracking-tight {text}">{value}</p>
		</div>
		{#if icon}
			<div class="rounded-lg p-2 {iconBg}">
				{@render icon()}
			</div>
		{/if}
	</div>
</div>
