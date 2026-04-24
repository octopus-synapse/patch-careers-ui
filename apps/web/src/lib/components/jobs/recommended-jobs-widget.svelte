<script lang="ts">
import { createJobsGetRecommendedJobs } from 'api-client';
import { Briefcase } from 'lucide-svelte';
import { Card, MatchBadge, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

type RecommendedJob = {
  id: string;
  title?: string;
  company?: string;
  location?: string | null;
  matchScore?: number;
};

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

const query = createJobsGetRecommendedJobs(
  () => ({ page: 1, limit: 5 }),
  () => ({ query: { enabled: browser && authenticated } }),
);

const items = $derived.by<RecommendedJob[]>(() => {
  const data = query.data as Record<string, unknown> | undefined;
  return (data?.data as RecommendedJob[] | undefined) ?? [];
});
</script>

<Card>
	{#snippet title()}
		<div class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-neutral-200">
				<span
					class="inline-flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20"
				>
					<Briefcase size={14} />
				</span>
				{t('jobs.dashboardRecommendedTitle')}
			</h2>
			<a
				href="/careers/browse-jobs"
				class="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-300"
			>
				{t('jobs.dashboardRecommendedSeeAll')}
			</a>
		</div>
	{/snippet}

	{#if query.isLoading}
		<ul class="space-y-2">
			{#each Array(3) as _}
				<li class="flex items-center gap-3">
					<div class="flex-1 space-y-1">
						<Skeleton shape="text" width="60%" />
						<Skeleton shape="text" width="40%" />
					</div>
					<Skeleton shape="rect" width="4rem" height="1.25rem" />
				</li>
			{/each}
		</ul>
	{:else if items.length === 0}
		<p class="text-xs text-gray-500 dark:text-neutral-500">
			{t('jobs.noRecommended')}
		</p>
	{:else}
		<ul class="-mx-2 divide-y divide-gray-100 dark:divide-neutral-800/80">
			{#each items as job (job.id)}
				<li>
					<button
						type="button"
						class="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
						onclick={() => goto(`/careers/browse-jobs/${job.id}`)}
					>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900 group-hover:text-emerald-700 dark:text-neutral-100 dark:group-hover:text-emerald-300">
								{job.title ?? '—'}
							</p>
							<p class="truncate text-xs text-gray-500 dark:text-neutral-500">
								{[job.company, job.location].filter(Boolean).join(' · ')}
							</p>
						</div>
						{#if typeof job.matchScore === 'number'}
							<MatchBadge score={job.matchScore} label={t('jobs.matchLabel')} />
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</Card>
