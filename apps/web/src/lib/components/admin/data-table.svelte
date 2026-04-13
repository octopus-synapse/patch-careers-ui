<script lang="ts" generics="T extends Record<string, unknown>">
	import type { ColorSchema } from 'ui';
	import type { Snippet } from 'svelte';
	import { Loader2 } from 'lucide-svelte';

	type Column = {
		key: string;
		label: string;
		width?: string;
	};

	type Props = {
		columns: Column[];
		data: T[];
		loading?: boolean;
		emptyMessage?: string;
		colorSchema?: ColorSchema;
		onrowclick?: (row: T) => void;
		cell?: Snippet<[{ row: T; key: string }]>;
	};

	let {
		columns,
		data,
		loading = false,
		emptyMessage = 'No data found',
		colorSchema = 'light',
		onrowclick,
		cell,
	}: Props = $props();

	const cs = $derived(colorSchema);
	const headerBg = $derived(cs === 'dark' ? 'bg-neutral-800/80' : 'bg-gray-50');
	const headerText = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const rowBorder = $derived(cs === 'dark' ? 'border-neutral-800' : 'border-gray-100');
	const rowHover = $derived(cs === 'dark' ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50');
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-400');
	const tableBg = $derived(cs === 'dark' ? 'bg-neutral-800/30' : 'bg-white');
	const tableBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');
</script>

<div class="overflow-hidden rounded-xl border {tableBg} {tableBorder}">
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead>
				<tr class={headerBg}>
					{#each columns as col}
						<th
							class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest {headerText}"
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
							<Loader2 size={20} class="mx-auto animate-spin {muted}" />
						</td>
					</tr>
				{:else if data.length === 0}
					<tr>
						<td colspan={columns.length} class="px-4 py-12 text-center text-xs {muted}">
							{emptyMessage}
						</td>
					</tr>
				{:else}
					{#each data as row}
						<tr
							class="border-t transition-colors {rowBorder} {onrowclick ? rowHover + ' cursor-pointer' : ''}"
							onclick={() => onrowclick?.(row)}
						>
							{#each columns as col}
								<td class="px-4 py-3 text-sm {text}">
									{#if cell}
										{@render cell({ row, key: col.key })}
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
