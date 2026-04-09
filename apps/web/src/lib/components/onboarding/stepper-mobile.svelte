<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { Check } from 'lucide-svelte';

	type Step = {
		id: string;
		label: string;
	};

	type Props = {
		steps: Step[];
		currentStep: string;
		completedSteps: string[];
		progress: number;
		colorSchema?: ColorSchema;
	};

	let { steps, currentStep, completedSteps, progress, colorSchema = 'light' }: Props = $props();

	const barBg = $derived(colorSchema === 'dark' ? 'bg-neutral-700' : 'bg-gray-300');
	const barFill = $derived(colorSchema === 'dark' ? 'bg-neutral-200' : 'bg-gray-800');
	const text = $derived(colorSchema === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const checkBg = $derived(colorSchema === 'dark' ? 'bg-neutral-200 text-neutral-900' : 'bg-gray-800 text-white');
	const activeBg = $derived(colorSchema === 'dark' ? 'bg-neutral-700/50' : 'bg-white');

	let containerWidth = $state(0);
	const ITEM_MIN_WIDTH = 72;
	const visibleCount = $derived(Math.max(2, Math.min(steps.length, Math.floor(containerWidth / ITEM_MIN_WIDTH))));

	const currentIndex = $derived(steps.findIndex((s) => s.id === currentStep));
	const maxStart = $derived(Math.max(0, steps.length - visibleCount));
	const windowStart = $derived(Math.max(0, Math.min(currentIndex, maxStart)));
	const visibleSteps = $derived(steps.slice(windowStart, windowStart + visibleCount));

	function isCompleted(stepId: string): boolean {
		return completedSteps.includes(stepId);
	}
</script>

<div class="mb-6" bind:clientWidth={containerWidth}>
	{#if containerWidth > 0}
		<div class="flex justify-between gap-1">
			{#each visibleSteps as step, i}
				{@const completed = isCompleted(step.id)}
				{@const active = step.id === currentStep}
				{@const idx = windowStart + i}

				<div class="flex min-w-0 flex-1 flex-col items-center gap-1.5">
					<div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold
						{completed ? checkBg : active ? text + ' ' + activeBg + ' ring-2 ring-current' : muted}"
					>
						{#if completed}
							<Check size={11} />
						{:else}
							{idx + 1}
						{/if}
					</div>
					<span class="w-full truncate text-center text-[9px] font-semibold
						{active ? text : muted}"
					>
						{step.label}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-3 h-1 rounded-full {barBg}">
		<div
			class="h-1 rounded-full transition-all duration-500 {barFill}"
			style="width: {progress}%"
		></div>
	</div>
</div>
