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

	const barBg = $derived(colorSchema === 'dark' ? 'bg-neutral-700' : 'bg-gray-200');
	const barFill = $derived(colorSchema === 'dark' ? 'bg-neutral-200' : 'bg-gray-800');
	const text = $derived(colorSchema === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-400');
	const checkBg = $derived(colorSchema === 'dark' ? 'bg-neutral-200 text-neutral-900' : 'bg-gray-800 text-white');
	const border = $derived(colorSchema === 'dark' ? 'border-neutral-700' : 'border-gray-200');
	const activeBorder = $derived(colorSchema === 'dark' ? 'border-neutral-200' : 'border-gray-800');

	function isCompleted(stepId: string): boolean {
		return completedSteps.includes(stepId);
	}
</script>

<div class="mb-6">
	<div class="flex items-center justify-center gap-2">
		{#each steps as step, i}
			{@const completed = isCompleted(step.id)}
			{@const active = step.id === currentStep}

			{#if i > 0}
				<div class="h-px w-6 {completed ? barFill : barBg}"></div>
			{/if}

			<div class="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold
				{completed ? checkBg : active ? text + ' border-2 ' + activeBorder : muted + ' border ' + border}"
			>
				{#if completed}
					<Check size={11} />
				{:else}
					{i + 1}
				{/if}
			</div>
		{/each}
	</div>

	<div class="mt-3 h-1 rounded-full {barBg}">
		<div
			class="h-1 rounded-full transition-all duration-500 {barFill}"
			style="width: {progress}%"
		></div>
	</div>
</div>
