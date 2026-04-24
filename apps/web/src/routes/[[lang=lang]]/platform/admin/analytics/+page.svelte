<script lang="ts">
import { createAdminAnalyticsGetOverview, createAdminDashboardGetMetrics } from 'api-client';
import { Loader2 } from 'lucide-svelte';
import { browser } from '$app/environment';
import DateRangePicker, {
  type DateRangePreset,
} from '$lib/components/data/date-range-picker.svelte';
import ExportButton from '$lib/components/data/export-button.svelte';
import StatCard from '../_components/stat-card.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

let rangePreset = $state<DateRangePreset>('last30d');
let customFrom = $state<string | undefined>(undefined);
let customTo = $state<string | undefined>(undefined);

const period = $derived<'day' | 'week' | 'month'>(
  rangePreset === 'last7d'
    ? 'day'
    : rangePreset === 'last30d'
      ? 'day'
      : rangePreset === 'last90d'
        ? 'week'
        : rangePreset === 'lastYear'
          ? 'month'
          : 'week',
);

const analyticsQuery = createAdminAnalyticsGetOverview(
  () => ({
    period,
  }),
  () => ({
    query: { enabled: browser },
  }),
);

const metricsQuery = createAdminDashboardGetMetrics(() => ({
  query: { enabled: browser },
}));

const data = $derived(analyticsQuery.data);
const metrics = $derived(metricsQuery.data);

const rangeLabels = $derived({
  last7d: t?.('admin.analytics.last7Days') ?? 'Last 7 days',
  last30d: t?.('admin.analytics.last30Days') ?? 'Last 30 days',
  last90d: t?.('admin.analytics.last90Days') ?? 'Last 90 days',
  lastYear: t?.('admin.analytics.lastYear') ?? 'Last year',
  custom: t?.('admin.analytics.custom') ?? 'Custom',
});

const atsDist = $derived(data?.atsScoreDistribution);
const byLang = $derived(data?.resumesByLanguage);
const sections = $derived(data?.mostUsedSections);
const imports = $derived(data?.importSources);
const activeUsers = $derived(data?.activeUsers);
const contentStats = $derived(data?.contentStats);
const socialStats = $derived(data?.socialStats);
const jobStats = $derived(data?.jobStats);

function maxValue(arr: { count: number }[]): number {
  return Math.max(...arr.map((i) => i.count), 1);
}
</script>

<svelte:head>
	<title>{t?.('admin.analytics.title') ?? 'Analytics'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
			{t?.('admin.analytics.title') ?? 'Global Analytics'}
		</h1>
		<div class="flex flex-wrap items-center gap-2">
			<ExportButton data={[...(atsDist ?? []), ...(byLang ?? []), ...(sections ?? []), ...(imports ?? [])]} filename="analytics.csv" />
			<DateRangePicker
				preset={rangePreset}
				from={customFrom}
				to={customTo}
				labels={rangeLabels}
				onchange={(p, f, to2) => {
					rangePreset = p;
					customFrom = f;
					customTo = to2;
				}}
			/>
		</div>
	</div>

	{#if rangePreset === 'custom'}
		<div class="rounded-lg border px-4 py-2 border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30">
			<p class="text-xs text-amber-700 dark:text-amber-400">
				{t?.('admin.analytics.customFallbackNote') ?? 'Custom ranges are not yet supported by the backend. Showing the closest preset approximation.'}
			</p>
		</div>
	{/if}

	{#if metrics}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
			<StatCard label={t?.('admin.dashboard.signupsWeek') ?? 'Signups This Week'} value={metrics.signupsThisWeek} />
			<StatCard label={t?.('admin.dashboard.signupsMonth') ?? 'Signups This Month'} value={metrics.signupsThisMonth} />
			<StatCard label={t?.('admin.dashboard.avgAtsScore') ?? 'Avg ATS Score'} value={metrics.averageAtsScore} />
			<StatCard label={t?.('admin.dashboard.onboardingRate') ?? 'Onboarding Rate'} value={`${metrics.onboardingCompletionRate}%`} />
		</div>
	{/if}

	{#if analyticsQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
		</div>
	{:else if data}
		<!-- Active users (DAU/MAU) -->
		{#if activeUsers}
			<div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				<StatCard label="DAU" value={activeUsers.dau} />
				<StatCard label="MAU" value={activeUsers.mau} />
				<StatCard
					label="DAU/MAU"
					value={activeUsers.mau > 0 ? `${Math.round((activeUsers.dau / activeUsers.mau) * 100)}%` : '—'}
				/>
				<StatCard
					label="Stickiness"
					value={activeUsers.mau > 0 && activeUsers.dau > 0 ? 'active' : 'low'}
				/>
			</div>
		{/if}

		<!-- Content stats (posts/comments/reactions) -->
		{#if contentStats}
			<div class="grid grid-cols-3 gap-3 sm:gap-4">
				<StatCard label={t?.('feed.tabsPosts') ?? 'Posts'} value={contentStats.posts} />
				<StatCard label={t?.('feed.comments') ?? 'Comments'} value={contentStats.comments} />
				<StatCard label={t?.('feed.tabsReactions') ?? 'Reactions'} value={contentStats.reactions} />
			</div>
		{/if}

		<!-- Social stats (connections + blocks) -->
		{#if socialStats}
			<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
				<StatCard label="Pending invites" value={socialStats.pendingInvitations} />
				<StatCard label="Accepted" value={socialStats.acceptedConnections} />
				<StatCard label="Rejected" value={socialStats.rejectedConnections} />
				<StatCard label="Acceptance rate" value={`${socialStats.acceptanceRate}%`} />
				<StatCard label="Blocked" value={socialStats.blockedUsers} />
			</div>
		{/if}

		<!-- Job stats -->
		{#if jobStats}
			<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
				<StatCard label="Jobs posted" value={jobStats.postedJobs} />
				<StatCard label="Active jobs" value={jobStats.activeJobs} />
				<StatCard label="Applications" value={jobStats.applications} />
				<StatCard label="Withdrawn" value={jobStats.withdrawn} />
				<StatCard label="Apps / job" value={jobStats.applicationsPerJob} />
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- ATS Score Distribution -->
			<div class="rounded-xl border p-3 sm:p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
					{t?.('admin.analytics.atsDistribution') ?? 'ATS Score Distribution'}
				</h3>
				<div class="flex items-end gap-1 sm:gap-2" style="height: 100px; min-height: 80px">
					{#each atsDist ?? [] as bucket}
						{@const pct = (bucket.count / maxValue(atsDist ?? [])) * 100}
						<div class="flex flex-1 flex-col items-center gap-1">
							<span class="text-[9px] text-gray-500 dark:text-neutral-500">{bucket.count}</span>
							<div class="w-full rounded-t bg-gray-700 dark:bg-neutral-400" style="height: {pct}%; min-height: 2px"></div>
							<span class="text-[9px] text-gray-500 dark:text-neutral-500">{bucket.bucket}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Resumes by Language -->
			<div class="rounded-xl border p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
					{t?.('admin.analytics.resumesByLanguage') ?? 'Resumes by Language'}
				</h3>
				<div class="space-y-3">
					{#each byLang ?? [] as lang}
						{@const pct = (lang.count / maxValue(byLang ?? [])) * 100}
						<div>
							<div class="flex items-center justify-between text-xs text-gray-800 dark:text-neutral-200">
								<span>{lang.language}</span>
								<span>{lang.count}</span>
							</div>
							<div class="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
								<div class="h-full rounded-full bg-gray-700 dark:bg-neutral-400" style="width: {pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Most Used Sections -->
			<div class="rounded-xl border p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
					{t?.('admin.analytics.topSections') ?? 'Most Used Sections'}
				</h3>
				<div class="space-y-2">
					{#each sections ?? [] as section}
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-800 dark:text-neutral-200">{section.title}</span>
							<span class="text-gray-500 dark:text-neutral-500">{section.count}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Import Sources -->
			<div class="rounded-xl border p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
					{t?.('admin.analytics.importSources') ?? 'Import Sources'}
				</h3>
				<div class="space-y-2">
					{#each imports ?? [] as src}
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-800 dark:text-neutral-200">{src.source}</span>
							<span class="text-gray-500 dark:text-neutral-500">{src.count}</span>
						</div>
					{/each}
					{#if !imports?.length}
						<p class="text-xs text-gray-500 dark:text-neutral-500">No imports yet</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
