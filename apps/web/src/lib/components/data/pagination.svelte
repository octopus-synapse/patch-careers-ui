<script lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-svelte';
import { Button } from 'ui';

type Props = {
  page: number;
  totalPages: number;
  onpagechange: (page: number) => void;
};

let { page, totalPages, onpagechange }: Props = $props();

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
	<div class="flex items-center gap-0.5 sm:gap-1">
		<Button
			variant="icon"
			size="sm"
			onclick={() => onpagechange(page - 1)}
			disabled={page <= 1}
			aria-label="Previous page"
		>
			<ChevronLeft size={16} />
		</Button>

		{#each pages() as p}
			{#if p === '...'}
				<span class="px-2 text-xs text-gray-400 dark:text-neutral-500">...</span>
			{:else}
				<Button
					variant="ghost"
					size="xs"
					onclick={() => onpagechange(p)}
					class={p === page ? 'bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200' : ''}
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
			aria-label="Next page"
		>
			<ChevronRight size={16} />
		</Button>
	</div>
{/if}
