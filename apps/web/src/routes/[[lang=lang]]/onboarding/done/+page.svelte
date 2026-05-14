<script lang="ts">
import { ArrowRight } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

// 30 confetti pieces with random delay/left offset; kept stable per mount.
const pieces = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 0.8,
  duration: 2 + Math.random() * 2,
  hue: Math.floor(Math.random() * 360),
  size: 6 + Math.random() * 8,
}));

onMount(() => {
  const timer = setTimeout(() => goto('/my-profile/dashboard'), 2400);
  return () => clearTimeout(timer);
});
</script>

<svelte:head>
	<title>{t('onboarding.doneTitle') ?? 'Pronto!'}</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
	<!-- Confetti layer -->
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		{#each pieces as p (p.id)}
			<span
				class="confetti"
				style:left="{p.left}%"
				style:animation-delay="{p.delay}s"
				style:animation-duration="{p.duration}s"
				style:background-color="hsl({p.hue}, 80%, 60%)"
				style:width="{p.size}px"
				style:height="{p.size}px"
			></span>
		{/each}
	</div>

	<div class="relative z-10 space-y-4">
		<h1 class="text-2xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
			{t('onboarding.doneHeadline') ?? t('onboarding.done.heading')}
		</h1>
		<p class="text-sm text-gray-500 dark:text-neutral-500">
			{t('onboarding.doneSubtitle') ?? 'Bora aplicar 🚀'}
		</p>
		<Button variant="solid" onclick={() => goto('/careers/browse-jobs')}>
			{t('onboarding.doneCta') ?? t('onboarding.done.seeJobsCta')}
			<ArrowRight size={14} />
		</Button>
	</div>
</div>

<style>
	.confetti {
		position: absolute;
		top: -20px;
		border-radius: 2px;
		animation-name: fall;
		animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		animation-fill-mode: forwards;
	}

	@keyframes fall {
		0% {
			transform: translateY(0) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateY(120vh) rotate(720deg);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.confetti {
			display: none;
		}
	}
</style>
