<script lang="ts">
import { Check } from 'lucide-svelte';

type Step = {
  id: string;
  label: string;
};

type Strength = {
  score: number;
  message: string;
  level: string;
};

type Props = {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  progress: number;
  strength?: Strength;
};

let { steps, currentStep, completedSteps, progress, strength }: Props = $props();

const strengthScore = $derived(strength?.score ?? progress);
const strengthMessage = $derived(strength?.message ?? '');

const barColor = $derived(
  strengthScore >= 75
    ? 'bg-emerald-500'
    : strengthScore >= 50
      ? 'bg-blue-500'
      : strengthScore >= 25
        ? 'bg-blue-400'
        : 'bg-gray-400 dark:bg-neutral-500',
);

let containerWidth = $state(0);
const ITEM_MIN_WIDTH = 72;
const visibleCount = $derived(
  Math.max(2, Math.min(steps.length, Math.floor(containerWidth / ITEM_MIN_WIDTH))),
);

const currentIndex = $derived(steps.findIndex((s) => s.id === currentStep));
const maxStart = $derived(Math.max(0, steps.length - visibleCount));
const windowStart = $derived(Math.max(0, Math.min(currentIndex, maxStart)));
const visibleSteps = $derived(steps.slice(windowStart, windowStart + visibleCount));

function isCompleted(stepId: string): boolean {
  return completedSteps.includes(stepId);
}
</script>

<div class="mb-6" bind:clientWidth={containerWidth}>
	<!-- Sticky progress bar -->
	<div class="sticky top-0 z-10 h-1 w-full bg-gray-200 dark:bg-neutral-700">
		<div
			class="h-full transition-all duration-700 {
				(strength?.score ?? 0) >= 75 ? 'bg-emerald-500' :
				(strength?.score ?? 0) >= 50 ? 'bg-blue-500' :
				(strength?.score ?? 0) >= 25 ? 'bg-sky-400' :
				'bg-gray-400 dark:bg-neutral-500'
			}"
			style="width: {progress}%"
		></div>
	</div>

	{#if containerWidth > 0}
		<div class="flex justify-between gap-1">
			{#each visibleSteps as step, i}
				{@const completed = isCompleted(step.id)}
				{@const active = step.id === currentStep}
				{@const idx = windowStart + i}

				<div class="flex min-w-0 flex-1 flex-col items-center gap-1.5">
					<div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold
						{completed ? 'bg-gray-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : active ? 'text-gray-800 dark:text-neutral-200 bg-white dark:bg-neutral-700/50 ring-2 ring-current' : 'text-gray-500 dark:text-neutral-500'}"
					>
						{#if completed}
							<Check size={11} />
						{:else}
							{idx + 1}
						{/if}
					</div>
					<span class="w-full truncate text-center text-[9px] font-semibold
						{active ? 'text-gray-800 dark:text-neutral-200' : 'text-gray-500 dark:text-neutral-500'}"
					>
						{step.label}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-3 h-1 rounded-full bg-gray-200 dark:bg-neutral-700">
		<div
			class="h-1 rounded-full transition-all duration-700 {barColor}"
			style="width: {strengthScore}%"
		></div>
	</div>
	{#if strengthMessage}
		<p class="mt-1.5 text-center text-xs font-medium transition-all duration-500 text-gray-500 dark:text-neutral-500">
			{strengthMessage}
		</p>
	{/if}
</div>
