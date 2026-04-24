<script lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-svelte';
import Button from './button.svelte';

type Props = {
  page: number;
  totalPages: number;
  onpagechange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onpagesizechange?: (size: number) => void;
};

let {
  page,
  totalPages,
  onpagechange,
  pageSize,
  pageSizeOptions,
  onpagesizechange,
}: Props = $props();

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

const showPageSize = $derived(
  Boolean(pageSizeOptions && pageSizeOptions.length > 0 && onpagesizechange && pageSize !== undefined),
);
</script>

{#if totalPages > 1 || showPageSize}
	<div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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

		{#if showPageSize}
			<label class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500">
				<span>Rows:</span>
				<select
					value={pageSize}
					onchange={(e) => onpagesizechange?.(Number((e.target as HTMLSelectElement).value))}
					class="rounded-lg border px-2 py-1 outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
					aria-label="Rows per page"
				>
					{#each pageSizeOptions ?? [] as size}
						<option value={size}>{size}</option>
					{/each}
				</select>
			</label>
		{/if}
	</div>
{/if}
