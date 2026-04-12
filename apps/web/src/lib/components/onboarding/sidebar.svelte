<script lang="ts">
	import type { ColorSchema } from 'ui';
	import type { Translator } from 'i18n';
	import { Check } from 'lucide-svelte';

	type Step = {
		id: string;
		label: string;
		icon?: string;
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
		missingRequired?: string[];
		colorSchema?: ColorSchema;
		t: Translator;
		ongoto: (stepId: string) => void;
	};

	let { steps, currentStep, completedSteps, progress, strength, missingRequired = [], colorSchema = 'light', t, ongoto }: Props = $props();

	const text = $derived(colorSchema === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const border = $derived(colorSchema === 'dark' ? 'border-neutral-700' : 'border-gray-300');
	const barBg = $derived(colorSchema === 'dark' ? 'bg-neutral-700' : 'bg-gray-200');
	const checkBg = $derived(colorSchema === 'dark' ? 'bg-neutral-200 text-neutral-900' : 'bg-gray-800 text-white');
	const activeBg = $derived(colorSchema === 'dark' ? 'bg-neutral-700/50' : 'bg-white');

	const strengthScore = $derived(strength?.score ?? progress);
	const strengthMessage = $derived(strength?.message ?? '');

	const barColor = $derived(
		strengthScore >= 75 ? 'bg-emerald-500'
		: strengthScore >= 50 ? 'bg-blue-500'
		: strengthScore >= 25 ? 'bg-blue-400'
		: colorSchema === 'dark' ? 'bg-neutral-500' : 'bg-gray-400'
	);

	function isCompleted(stepId: string): boolean {
		return completedSteps.includes(stepId);
	}

	function isMissing(stepId: string): boolean {
		return missingRequired.includes(stepId);
	}
</script>

<aside class="flex w-56 flex-shrink-0 flex-col border-r pr-6 {border}">
	<div class="mb-6">
		<div class="h-1 rounded-full {barBg}">
			<div
				class="h-1 rounded-full transition-all duration-700 {barColor}"
				style="width: {strengthScore}%"
			></div>
		</div>
		{#if strengthMessage}
			<p class="mt-2 text-[10px] font-semibold uppercase tracking-widest transition-all duration-500 {muted}">
				{strengthMessage}
			</p>
		{/if}
	</div>

	<nav class="flex flex-col gap-1">
		{#each steps as step}
			{@const completed = isCompleted(step.id)}
			{@const active = step.id === currentStep}
			{@const missing = isMissing(step.id)}

			<button
				onclick={() => ongoto(step.id)}
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs cursor-pointer transition-colors
					{active ? activeBg : ''}"
			>
				<div class="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold
					{completed ? checkBg : active ? text + ' border ' + border : muted + ' border ' + border}"
				>
					{#if completed}
						<Check size={11} />
					{:else}
						{steps.indexOf(step) + 1}
					{/if}
					{#if missing && !completed}
						<span class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
					{/if}
				</div>
				<span class="{active ? 'font-semibold ' + text : muted}">
					{step.label}
				</span>
			</button>
		{/each}
	</nav>
</aside>
