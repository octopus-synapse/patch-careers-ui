<script lang="ts">
import { Calendar } from 'lucide-svelte';
import Button from './button.svelte';

export type DateRangePreset = 'last7d' | 'last30d' | 'last90d' | 'lastYear' | 'custom';

type Props = {
  preset: DateRangePreset;
  from?: string;
  to?: string;
  onchange: (preset: DateRangePreset, from?: string, to?: string) => void;
  labels?: Partial<Record<DateRangePreset, string>>;
};

let { preset, from, to, onchange, labels }: Props = $props();

const PRESETS: { key: DateRangePreset; days?: number }[] = [
  { key: 'last7d', days: 7 },
  { key: 'last30d', days: 30 },
  { key: 'last90d', days: 90 },
  { key: 'lastYear', days: 365 },
  { key: 'custom' },
];

function defaultLabel(key: DateRangePreset): string {
  if (key === 'last7d') return 'Last 7 days';
  if (key === 'last30d') return 'Last 30 days';
  if (key === 'last90d') return 'Last 90 days';
  if (key === 'lastYear') return 'Last year';
  return 'Custom';
}

function labelFor(key: DateRangePreset): string {
  return labels?.[key] ?? defaultLabel(key);
}

function handlePreset(p: DateRangePreset) {
  if (p === 'custom') {
    onchange('custom', from, to);
    return;
  }
  onchange(p);
}
</script>

<div class="flex flex-wrap items-center gap-2">
	<div class="flex items-center gap-1">
		<Calendar size={14} class="text-gray-500 dark:text-neutral-500" />
		{#each PRESETS as p}
			<Button
				variant={preset === p.key ? 'solid' : 'ghost'}
				size="xs"
				onclick={() => handlePreset(p.key)}
			>
				{labelFor(p.key)}
			</Button>
		{/each}
	</div>
	{#if preset === 'custom'}
		<div class="flex items-center gap-2">
			<input
				type="date"
				value={from ?? ''}
				onchange={(e) => onchange('custom', (e.target as HTMLInputElement).value, to)}
				aria-label="From date"
				class="rounded-lg border px-2 py-1 text-xs outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
			/>
			<span class="text-xs text-gray-500 dark:text-neutral-500">→</span>
			<input
				type="date"
				value={to ?? ''}
				onchange={(e) => onchange('custom', from, (e.target as HTMLInputElement).value)}
				aria-label="To date"
				class="rounded-lg border px-2 py-1 text-xs outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
			/>
		</div>
	{/if}
</div>
