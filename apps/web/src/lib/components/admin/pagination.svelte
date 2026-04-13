<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	type Props = {
		page: number;
		totalPages: number;
		colorSchema?: ColorSchema;
		onpagechange: (page: number) => void;
	};

	let { page, totalPages, colorSchema = 'light', onpagechange }: Props = $props();

	const cs = $derived(colorSchema);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-400');
	const btnBg = $derived(cs === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-gray-100');
	const activeBg = $derived(cs === 'dark' ? 'bg-neutral-700 text-neutral-200' : 'bg-gray-200 text-gray-800');

	const pages = $derived(() => {
		const result: (number | '...')[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) result.push(i);
			return result;
		}
		result.push(1);
		if (page > 3) result.push('...');
		for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
			result.push(i);
		}
		if (page < totalPages - 2) result.push('...');
		result.push(totalPages);
		return result;
	});
</script>

{#if totalPages > 1}
	<div class="flex items-center gap-1">
		<button
			onclick={() => onpagechange(page - 1)}
			disabled={page <= 1}
			class="rounded-lg p-1.5 transition-colors disabled:opacity-30 {btnBg} {text}"
			aria-label="Previous page"
		>
			<ChevronLeft size={16} />
		</button>

		{#each pages() as p}
			{#if p === '...'}
				<span class="px-2 text-xs {muted}">...</span>
			{:else}
				<button
					onclick={() => onpagechange(p)}
					class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors {p === page ? activeBg : btnBg + ' ' + text}"
				>
					{p}
				</button>
			{/if}
		{/each}

		<button
			onclick={() => onpagechange(page + 1)}
			disabled={page >= totalPages}
			class="rounded-lg p-1.5 transition-colors disabled:opacity-30 {btnBg} {text}"
			aria-label="Next page"
		>
			<ChevronRight size={16} />
		</button>
	</div>
{/if}
