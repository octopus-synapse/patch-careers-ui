<script lang="ts">
type Props = {
  score: number;
  label?: string;
};

let { score, label = 'match' }: Props = $props();

const pct = $derived(Math.max(0, Math.min(100, Math.round(score))));

const tone = $derived(
  pct >= 80
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    : pct >= 50
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : 'bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300',
);
</script>

<span
	class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {tone}"
	title="{pct}% {label}"
>
	<span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-current"></span>
	{pct}% {label}
</span>
