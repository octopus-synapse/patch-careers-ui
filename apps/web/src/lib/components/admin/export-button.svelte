<script lang="ts">
	import { Button } from 'ui';
	import { Download } from 'lucide-svelte';

	type Props = {
		data: Record<string, unknown>[];
		filename?: string;
	};

	let { data, filename = 'export.csv' }: Props = $props();

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

<Button
	variant="ghost"
	size="sm"
	onclick={exportCsv}
	disabled={data.length === 0}
>
	<Download size={14} />
	CSV
</Button>
