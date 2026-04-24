<script lang="ts" generics="T extends Record<string, unknown>">
import type { Snippet } from 'svelte';

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-svelte';

type Column = {
		key: string;
		label: string;
		width?: string;
		sortable?: boolean;
		hideOnMobile?: boolean;
	};

type SortDir = 'asc' | 'desc';

type Props = {
		columns: Column[];
		data?: T[];
		loading?: boolean;
		emptyMessage?: string;
		onrowclick?: (row: T) => void;
		cell?: Snippet<[{ row: T; key: string; value: unknown }]>;
	};

let {
		columns,
		data,
		loading = false,
		emptyMessage = 'No data found',
		onrowclick,
		cell,
	}: Props = $props();

let sortKey = $state<string | null>(null);
let sortDir = $state<SortDir>('asc');

function toggleSort(col: Column) {
	if (!col.sortable) return;
	if (sortKey !== col.key) {
		sortKey = col.key;
		sortDir = 'asc';
	} else if (sortDir === 'asc') {
		sortDir = 'desc';
	} else {
		sortKey = null;
		sortDir = 'asc';
	}
}

function compare(a: unknown, b: unknown): number {
	if (a == null && b == null) return 0;
	if (a == null) return -1;
	if (b == null) return 1;
	if (typeof a === 'number' && typeof b === 'number') return a - b;
	const as = String(a);
	const bs = String(b);
	const an = Date.parse(as);
	const bn = Date.parse(bs);
	if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
	return as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' });
}

const sortedData = $derived.by(() => {
	if (!data || !sortKey) return data;
	const key = sortKey;
	const dir = sortDir === 'asc' ? 1 : -1;
	return [...data].sort((a, b) => compare(a[key], b[key]) * dir);
});

function ariaSortFor(col: Column): 'ascending' | 'descending' | 'none' | undefined {
	if (!col.sortable) return undefined;
	if (sortKey !== col.key) return 'none';
	return sortDir === 'asc' ? 'ascending' : 'descending';
}
</script>

<div class="overflow-hidden rounded-xl border bg-white dark:bg-neutral-800/30 border-gray-200 dark:border-neutral-700/50">
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead>
				<tr class="bg-gray-50 dark:bg-neutral-800/80">
					{#each columns as col}
						<th
							scope="col"
							aria-sort={ariaSortFor(col)}
							class="px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-semibold text-gray-500 dark:text-neutral-500 whitespace-nowrap {col.hideOnMobile ? 'hidden sm:table-cell' : ''}"
							style={col.width ? `width: ${col.width}` : ''}
						>
							{#if col.sortable}
								<button
									type="button"
									onclick={() => toggleSort(col)}
									class="inline-flex items-center gap-1 hover:text-gray-800 dark:hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
								>
									{col.label}
									{#if sortKey !== col.key}
										<ChevronsUpDown size={12} class="opacity-50" />
									{:else if sortDir === 'asc'}
										<ChevronUp size={12} />
									{:else}
										<ChevronDown size={12} />
									{/if}
								</button>
							{:else}
								{col.label}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					{#each Array(6) as _}
						<tr class="border-t border-gray-100 dark:border-neutral-800">
							{#each columns as col}
								<td class="px-3 py-2.5 sm:px-4 sm:py-3 {col.hideOnMobile ? 'hidden sm:table-cell' : ''}">
									<div class="h-3 w-full max-w-[120px] rounded bg-gray-200 dark:bg-neutral-700 animate-pulse"></div>
								</td>
							{/each}
						</tr>
					{/each}
				{:else if !sortedData?.length}
					<tr>
						<td colspan={columns.length} class="px-4 py-12 text-center text-xs text-gray-400 dark:text-neutral-500">
							{emptyMessage}
						</td>
					</tr>
				{:else}
					{#each sortedData as row}
						<tr
							class="border-t transition-colors border-gray-100 dark:border-neutral-800 {onrowclick ? 'hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer' : ''}"
							onclick={() => onrowclick?.(row)}
						>
							{#each columns as col}
								<td class="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-800 dark:text-neutral-200 whitespace-nowrap {col.hideOnMobile ? 'hidden sm:table-cell' : ''}">
									{#if cell}
										{@render cell({ row, key: col.key, value: row[col.key] })}
									{:else}
										{row[col.key] ?? '—'}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
