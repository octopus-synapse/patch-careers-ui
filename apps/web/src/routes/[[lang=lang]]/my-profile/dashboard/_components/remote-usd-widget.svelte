<script lang="ts">
import { createJobsFindAll } from 'api-client';
import { ArrowRight, Globe2 } from 'lucide-svelte';
import { Card, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

type RemoteJob = {
  id?: string;
  title?: string;
  company?: string;
  paymentCurrency?: string | null;
  salaryRange?: string | null;
};

const t = $derived(locale.t);

const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

// Show the first 3 USD/EUR remote jobs as mini cards instead of a raw count
// — gives the user something to act on (per UX feedback #11).
const query = createJobsFindAll(
  () => ({ page: 1, limit: 3, search: '', skills: '', paymentCurrency: 'USD,EUR' }),
  () => ({ query: { enabled: browser && authenticated } }),
);

const items = $derived.by<RemoteJob[]>(() => {
  const d = query.data as Record<string, unknown> | undefined;
  return (
    (d?.items as RemoteJob[] | undefined) ??
    (d?.data as RemoteJob[] | undefined) ??
    (Array.isArray(d) ? (d as RemoteJob[]) : []) ??
    []
  );
});
const total = $derived((query.data as { total?: number } | undefined)?.total ?? items.length);
</script>

<Card>
	{#snippet title()}
		<div class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-neutral-200">
				<Globe2 size={16} class="text-emerald-500" />
				{t('jobs.remoteUsd.dashboardTitle')}
			</h2>
			<a
				href="/careers/remote-usd-jobs"
				class="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
			>
				{t('jobs.remoteUsd.dashboardSeeAll')}
				<ArrowRight size={11} />
			</a>
		</div>
	{/snippet}

	{#if query.isLoading}
		<ul class="space-y-2">
			{#each Array(3) as _}
				<li><Skeleton shape="text" width="80%" /></li>
			{/each}
		</ul>
	{:else if items.length === 0}
		<p class="text-sm text-gray-700 dark:text-neutral-300">
			{t('jobs.remoteUsd.dashboardCountEmpty')}
		</p>
	{:else}
		<ul class="divide-y divide-gray-100 dark:divide-neutral-700/40">
			{#each items as job (job.id)}
				<li>
					<button
						type="button"
						class="flex w-full items-center justify-between gap-2 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700/40"
						onclick={() => job.id && goto(`/careers/browse-jobs/${job.id}`)}
					>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-800 dark:text-neutral-200">
								{job.title ?? '—'}
							</p>
							{#if job.company}
								<p class="truncate text-xs text-gray-500 dark:text-neutral-500">{job.company}</p>
							{/if}
						</div>
						{#if job.paymentCurrency}
							<span class="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
								{job.paymentCurrency}
							</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
		{#if total > items.length}
			<p class="mt-2 text-xs text-gray-500 dark:text-neutral-500">
				{t('jobs.remoteUsd.dashboardShowing', { shown: items.length, total })}
			</p>
		{/if}
	{/if}
</Card>
