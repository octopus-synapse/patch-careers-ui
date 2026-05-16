<script lang="ts">
import { ArrowRight } from 'lucide-svelte';
import { Button } from 'ui';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  onNext: () => void;
};

let { onNext }: Props = $props();

const t = $derived(locale.t);
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center px-3 py-8 text-center sm:px-4 sm:py-12">
	<h1 class="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-neutral-100 dark:via-neutral-300 dark:to-neutral-500 sm:text-4xl">
		{t('onboarding.welcome.heading')}
	</h1>

	<p class="mt-4 max-w-md text-sm text-gray-500 dark:text-neutral-400">
		{t('onboarding.welcome.subtitle')}
	</p>

	<Button
		variant="solid"
		size="lg"
		onclick={onNext}
		class="mt-10 rounded-full"
	>
		<span class="flex items-center gap-2">
			{t('onboarding.welcome.startCta')}
			<ArrowRight size={16} />
		</span>
	</Button>

	<p class="mt-6 text-[11px] text-gray-400 dark:text-neutral-500">
		{t('onboarding.welcome.autosaveHint')}
	</p>
</div>
