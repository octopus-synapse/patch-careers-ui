<script lang="ts">
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import GreetingHero from './_components/greeting-hero.svelte';
import KpiBoard from './_components/kpi-board.svelte';
import KpiCharts from './_components/kpi-charts.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const session = useAuth();
const user = $derived(session.user);
const authenticated = $derived(session.isAuthenticated);

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

const displayName = $derived(String(user?.name ?? user?.email ?? ''));
</script>

<svelte:head>
	<title>{t('dashboard.pageTitle')}</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<span class="text-sm text-gray-500 dark:text-neutral-500">…</span>
	</div>
{:else if authenticated && user}
	<div
		class="relative min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-gray-50/60 via-white to-white pt-20 pb-16 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950"
	>
		<main class="mx-auto max-w-6xl px-4 sm:px-6">
			<GreetingHero name={displayName} />

			<div class="mt-8">
				<KpiBoard />
			</div>

			<div class="mt-8">
				<KpiCharts />
			</div>
		</main>
	</div>
{/if}
