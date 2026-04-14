<script lang="ts" generics="T extends Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import { Loader2 } from 'lucide-svelte';

	type Column = {
		key: string;
		label: string;
		width?: string;
	};

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
</script>

<div class="overflow-hidden rounded-xl border bg-white dark:bg-neutral-800/30 border-gray-200 dark:border-neutral-700/50">
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead>
				<tr class="bg-gray-50 dark:bg-neutral-800/80">
					{#each columns as col}
						<th
							class="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500 whitespace-nowrap"
							style={col.width ? `width: ${col.width}` : ''}
						>
							{col.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan={columns.length} class="px-4 py-12 text-center">
							<Loader2 size={20} class="mx-auto animate-spin text-gray-400 dark:text-neutral-500" />
						</td>
					</tr>
				{:else if !data?.length}
					<tr>
						<td colspan={columns.length} class="px-4 py-12 text-center text-xs text-gray-400 dark:text-neutral-500">
							{emptyMessage}
						</td>
					</tr>
				{:else}
					{#each data as row}
						<tr
							class="border-t transition-colors border-gray-100 dark:border-neutral-800 {onrowclick ? 'hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer' : ''}"
							onclick={() => onrowclick?.(row)}
						>
							{#each columns as col}
								<td class="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-800 dark:text-neutral-200 whitespace-nowrap">
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
