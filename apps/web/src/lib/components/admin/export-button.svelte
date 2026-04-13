<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { Download } from 'lucide-svelte';

	type Props = {
		data: Record<string, unknown>[];
		filename?: string;
		colorSchema?: ColorSchema;
	};

	let { data, filename = 'export.csv', colorSchema = 'light' }: Props = $props();

	const cs = $derived(colorSchema);
	const btnClass = $derived(
		cs === 'dark'
			? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
			: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
	);

	function exportCsv() {
		if (data.length === 0) return;

		const headers = Object.keys(data[0]);
		const rows = data.map((row) =>
			headers.map((h) => {
				const val = row[h];
				const str = val === null || val === undefined ? '' : String(val);
				return str.includes(',') || str.includes('"') || str.includes('\n')
					? `"${str.replace(/"/g, '""')}"`
					: str;
			}).join(',')
		);

		const csv = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<button
	onclick={exportCsv}
	disabled={data.length === 0}
	class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors disabled:opacity-30 {btnClass}"
	title="Export CSV"
>
	<Download size={14} />
	CSV
</button>
