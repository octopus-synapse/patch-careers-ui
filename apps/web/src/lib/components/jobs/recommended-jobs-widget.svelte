<script lang="ts">
import { createGetV1JobsRecommended } from 'api-client';
import { Card, MatchBadge, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

/**
 * Structural shape — the SDK swagger ships `data: void` so we cast at the
 * boundary. The widget is dumb: title/company/location/matchScore are
 * surfaced verbatim from the backend.
 */
type RecommendedJob = {
  id: string;
  title?: string;
  company?: string;
  location?: string | null;
  matchScore?: number;
};

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated ?? false);

const query = createGetV1JobsRecommended(
  { page: 1, limit: 5 },
  { query: { enabled: () => browser && authenticated} },
);

const items = $derived.by<RecommendedJob[]>(() => {
  const data = $query.data as { items?: RecommendedJob[] } | undefined;
  return data?.items ?? [];
});
</script>

<Card>
	{#snippet title()}
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
				{t('jobs.dashboardRecommendedTitle')}
			</h2>
			<a
				href="/careers/browse-jobs"
				class="text-xs font-medium text-cyan-600 hover:underline dark:text-cyan-300"
			>
				{t('jobs.dashboardRecommendedSeeAll')}
			</a>
		</div>
	{/snippet}

	{#if $query.isLoading}
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
					<a
						href={`/careers/browse-jobs/${job.id}`}
						class="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
					>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900 group-hover:text-cyan-700 dark:text-neutral-100 dark:group-hover:text-cyan-300">
								{job.title ?? '—'}
							</p>
							<p class="truncate text-xs text-gray-500 dark:text-neutral-500">
								{[job.company, job.location].filter(Boolean).join(' · ')}
							</p>
						</div>
						{#if typeof job.matchScore === 'number'}
							<MatchBadge score={job.matchScore} label={t('jobs.matchLabel')} />
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</Card>
