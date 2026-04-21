<script lang="ts">
import { locale } from '$lib/state/locale.svelte';

type Props = {
  current: number;
  total: number;
};

const { current, total }: Props = $props();
const t = $derived(locale.t);
const percent = $derived(total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0);
</script>

<div class="mb-4 space-y-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
	<div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-500">
		<span>{t('onboarding.progressLabel', { current, total }) ?? `Passo ${current} de ${total}`}</span>
		<span>{percent}%</span>
	</div>
	<div class="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800">
		<div
			class="h-full bg-cyan-500 transition-all duration-300"
			style:width="{percent}%"
		></div>
	</div>
</div>
