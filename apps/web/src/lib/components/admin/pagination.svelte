<script lang="ts">
	import { Button } from 'ui';
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

	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-400');
</script>

{#if totalPages > 1}
	<div class="flex items-center gap-1">
		<Button
			variant="icon"
			size="sm"
			onclick={() => onpagechange(page - 1)}
			disabled={page <= 1}
			colorSchema={cs}
			aria-label="Previous page"
		>
			<ChevronLeft size={16} />
		</Button>

		{#each pages() as p}
			{#if p === '...'}
				<span class="px-2 text-xs {muted}">...</span>
			{:else}
				<Button
					variant="ghost"
					size="xs"
					onclick={() => onpagechange(p)}
					colorSchema={cs}
					class={p === page ? activeBg : ''}
				>
					{p}
				</Button>
			{/if}
		{/each}

		<Button
			variant="icon"
			size="sm"
			onclick={() => onpagechange(page + 1)}
			disabled={page >= totalPages}
			colorSchema={cs}
			aria-label="Next page"
		>
			<ChevronRight size={16} />
		</Button>
	</div>
{/if}
