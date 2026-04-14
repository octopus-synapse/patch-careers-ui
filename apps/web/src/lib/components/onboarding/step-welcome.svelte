<script lang="ts">
	import { Button } from 'ui';

	type StepData = {
		features?: Array<{ icon: string; title: string; description: string }>;
		estimatedMinutes?: number;
	};

	type Props = {
		step: { data?: StepData | unknown };
		onNext: () => void;
	};

	let { step, onNext }: Props = $props();

	const stepData = $derived(step.data && typeof step.data === 'object' && !Array.isArray(step.data) ? step.data as StepData : undefined);
	const features = $derived(stepData?.features);
	const estimatedMinutes = $derived(stepData?.estimatedMinutes ?? 5);
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
	<div class="w-full max-w-xl text-center">
		<h1
			class="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-neutral-100 dark:via-neutral-300 dark:to-neutral-500 sm:text-4xl"
		>
			Crie seu currículo profissional
		</h1>

		<p class="mt-4 text-sm text-gray-500 dark:text-neutral-400">
			Em apenas <span class="font-semibold text-gray-700 dark:text-neutral-200">{estimatedMinutes} minutos</span>
		</p>
	</div>

	{#if features?.length}
		<div class="mt-10 grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
			{#each features as feature}
				<div
					class="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800/60"
				>
					<span class="text-2xl">{feature.icon}</span>
					<h3 class="mt-3 text-sm font-bold text-gray-800 dark:text-neutral-200">
						{feature.title}
					</h3>
					<p class="mt-1 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
						{feature.description}
					</p>
				</div>
			{/each}
		</div>
	{/if}

	<Button
		variant="solid"
		size="lg"
		onclick={onNext}
		class="mt-10 rounded-full"
	>
		Começar agora →
	</Button>

	<p class="mt-6 text-[11px] text-gray-400 dark:text-neutral-500">
		Seu progresso é salvo automaticamente
	</p>
</div>
