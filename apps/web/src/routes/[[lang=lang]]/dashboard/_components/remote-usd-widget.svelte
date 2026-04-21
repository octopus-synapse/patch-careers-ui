<script lang="ts">
import { createJobsFindAll } from 'api-client';
import { ArrowRight, Globe2 } from 'lucide-svelte';
import { Card, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

// Server filters the list to USD/EUR jobs; we only need the total count.
const query = createJobsFindAll(
  () => ({ page: 1, limit: 1, search: '', skills: '', paymentCurrency: 'USD,EUR' }),
  () => ({ query: { enabled: browser && authenticated } }),
);

const count = $derived((query.data as { total?: number } | undefined)?.total ?? 0);
</script>

<Card>
	{#snippet title()}
		<div class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-neutral-200">
				<Globe2 size={16} class="text-emerald-500" />
				{t('jobs.remoteUsd.dashboardTitle')}
			</h2>
			<a
				href="/remote-usd"
				class="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
			>
				{t('jobs.remoteUsd.dashboardSeeAll')}
				<ArrowRight size={11} />
			</a>
		</div>
	{/snippet}

	{#if query.isLoading}
		<Skeleton shape="text" width="70%" />
	{:else if count === 0}
		<p class="text-xs text-gray-500 dark:text-neutral-500">
			{t('jobs.remoteUsd.dashboardCountEmpty')}
		</p>
	{:else}
		<p class="flex items-baseline gap-2">
			<span class="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{count}</span>
			<span class="text-xs text-gray-500 dark:text-neutral-500">
				{t('jobs.remoteUsd.dashboardCount', { count })}
			</span>
		</p>
	{/if}
</Card>
