<script lang="ts">
import { Download, Loader2 } from 'lucide-svelte';
import Button from '../button/button.component.svelte';

type Row = Record<string, unknown>;

type Props = {
  data?: Row[];
  filename?: string;
  fetchAll?: () => Promise<Row[]>;
};

let { data, filename = 'export.csv', fetchAll }: Props = $props();

let loading = $state(false);

function toCsv(rows: Row[]): string {
  const first = rows[0];
  if (!first) return '';
  const headers = Object.keys(first);
  const body = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(','),
  );
  return [headers.join(','), ...body].join('\n');
}

function download(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportCsv() {
  if (loading) return;
  if (fetchAll) {
    loading = true;
    try {
      const rows = await fetchAll();
      if (rows.length) download(toCsv(rows));
    } finally {
      loading = false;
    }
    return;
  }
  if (!data?.length) return;
  download(toCsv(data));
}

const disabled = $derived(loading || (!fetchAll && !data?.length));
</script>

<Button
	variant="ghost"
	size="sm"
	onclick={exportCsv}
	disabled={disabled}
>
	{#if loading}
		<Loader2 size={14} class="animate-spin" />
	{:else}
		<Download size={14} />
	{/if}
	CSV
</Button>
