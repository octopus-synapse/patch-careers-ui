<script lang="ts">
import { locale } from '$lib/state/locale.svelte';

type Step = {
  id: string;
  label: string;
};

type Props = {
  steps: Step[];
  currentStep: string;
  progress: number;
};

let { steps, currentStep, progress }: Props = $props();

const t = $derived(locale.t);
const currentIndex = $derived(steps.findIndex((s) => s.id === currentStep));
const total = $derived(steps.length);
const current = $derived(Math.max(1, currentIndex + 1));
const currentLabel = $derived(steps[currentIndex]?.label ?? '');
</script>

<div class="mb-6">
	<div class="mb-2 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-neutral-500">
		<span>{t('onboarding.progressLabel', { current, total })}</span>
		<span>{progress}%</span>
	</div>
	<div class="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
		<div
			class="h-full rounded-full bg-gray-800 transition-all duration-500 dark:bg-neutral-200"
			style:width={`${progress}%`}
		></div>
	</div>
	{#if currentLabel}
		<p class="mt-3 text-center text-sm font-semibold text-gray-800 dark:text-neutral-200">
			{currentLabel}
		</p>
	{/if}
</div>
