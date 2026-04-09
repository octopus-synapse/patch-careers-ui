<script lang="ts">
	import type { ColorSchema } from 'ui';
	import type { Translator } from 'i18n';
	import { Check } from 'lucide-svelte';

	type Step = {
		id: string;
		label: string;
		icon?: string;
	};

	type Props = {
		steps: Step[];
		currentStep: string;
		completedSteps: string[];
		progress: number;
		colorSchema?: ColorSchema;
		t: Translator;
		ongoto: (stepId: string) => void;
	};

	let { steps, currentStep, completedSteps, progress, colorSchema = 'light', t, ongoto }: Props = $props();

	const text = $derived(colorSchema === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const border = $derived(colorSchema === 'dark' ? 'border-neutral-700' : 'border-gray-300');
	const barBg = $derived(colorSchema === 'dark' ? 'bg-neutral-700' : 'bg-gray-300');
	const barFill = $derived(colorSchema === 'dark' ? 'bg-neutral-200' : 'bg-gray-800');
	const checkBg = $derived(colorSchema === 'dark' ? 'bg-neutral-200 text-neutral-900' : 'bg-gray-800 text-white');
	const activeBg = $derived(colorSchema === 'dark' ? 'bg-neutral-700/50' : 'bg-white');

	function isCompleted(stepId: string): boolean {
		return completedSteps.includes(stepId);
	}

	function isAccessible(stepId: string): boolean {
		return isCompleted(stepId) || stepId === currentStep;
	}
</script>

<aside class="flex w-56 flex-shrink-0 flex-col border-r pr-6 {border}">
	<div class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			<span class="text-[10px] font-semibold uppercase tracking-widest {muted}">
				{t('onboarding.progress', { value: String(progress) })}
			</span>
		</div>
		<div class="h-1 rounded-full {barBg}">
			<div
				class="h-1 rounded-full transition-all duration-500 {barFill}"
				style="width: {progress}%"
			></div>
		</div>
	</div>

	<nav class="flex flex-col gap-1">
		{#each steps as step}
			{@const completed = isCompleted(step.id)}
			{@const active = step.id === currentStep}
			{@const accessible = isAccessible(step.id)}

			<button
				onclick={() => accessible && ongoto(step.id)}
				disabled={!accessible}
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors
					{active ? activeBg : ''}
					{accessible ? 'cursor-pointer' : 'cursor-default opacity-50'}"
			>
				<div class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold
					{completed ? checkBg : active ? text + ' border ' + border : muted + ' border ' + border}"
				>
					{#if completed}
						<Check size={11} />
					{:else}
						{steps.indexOf(step) + 1}
					{/if}
				</div>
				<span class="{active ? 'font-semibold ' + text : muted}">
					{step.label}
				</span>
			</button>
		{/each}
	</nav>
</aside>
