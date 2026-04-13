<script lang="ts">
	import {
		createAdminAnalyticsGetOverview,
		createAdminDashboardGetMetrics,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { locale } from '$lib/locale.svelte';
	import { Loader2 } from 'lucide-svelte';
	import { SegmentToggle } from 'ui';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import ExportButton from '$lib/components/admin/export-button.svelte';

	const t = $derived(locale.t);

	let period = $state<'day' | 'week' | 'month'>('week');

	const analyticsQuery = createAdminAnalyticsGetOverview(() => ({
		period,
	}), () => ({
		query: { enabled: browser }
	}));

	const metricsQuery = createAdminDashboardGetMetrics(() => ({
		query: { enabled: browser }
	}));

	const data = $derived(analyticsQuery.data as Record<string, unknown> | undefined);
	const metrics = $derived(metricsQuery.data as Record<string, unknown> | undefined);

	const periodOptions = [
		{ value: 'day', label: t?.('admin.analytics.last30Days') ?? '30 Days' },
		{ value: 'week', label: '12 Weeks' },
		{ value: 'month', label: t?.('admin.analytics.lastYear') ?? '12 Months' },
	];

	const atsDist = $derived((data?.atsScoreDistribution as { bucket: string; count: number }[]) ?? []);
	const byLang = $derived((data?.resumesByLanguage as { language: string; count: number }[]) ?? []);
	const sections = $derived((data?.mostUsedSections as { title: string; count: number }[]) ?? []);
	const imports = $derived((data?.importSources as { source: string; count: number }[]) ?? []);

	function maxValue(arr: { count: number }[]): number {
		return Math.max(...arr.map(i => i.count), 1);
	}
</script>

<svelte:head>
	<title>{t?.('admin.analytics.title') ?? 'Analytics'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
			{t?.('admin.analytics.title') ?? 'Global Analytics'}
		</h1>
		<div class="flex items-center gap-2">
			<ExportButton data={[...atsDist, ...byLang, ...sections, ...imports]} filename="analytics.csv" />
			<SegmentToggle
			options={periodOptions}
			selected={period}
			onchange={(v) => period = v as 'day' | 'week' | 'month'}
		/>
		</div>
	</div>

	{#if metrics}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<StatCard label={t?.('admin.dashboard.signupsWeek') ?? 'Signups This Week'} value={metrics.signupsThisWeek as number} />
			<StatCard label={t?.('admin.dashboard.signupsMonth') ?? 'Signups This Month'} value={metrics.signupsThisMonth as number} />
			<StatCard label={t?.('admin.dashboard.avgAtsScore') ?? 'Avg ATS Score'} value={metrics.averageAtsScore as number} />
			<StatCard label={t?.('admin.dashboard.onboardingRate') ?? 'Onboarding Rate'} value={`${metrics.onboardingCompletionRate}%`} />
		</div>
	{/if}

	{#if analyticsQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
		</div>
	{:else if data}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- ATS Score Distribution -->
			<div class="rounded-xl border p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<h3 class="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
					{t?.('admin.analytics.atsDistribution') ?? 'ATS Score Distribution'}
				</h3>
				<div class="flex items-end gap-2" style="height: 120px">
					{#each atsDist as bucket}
						{@const pct = (bucket.count / maxValue(atsDist)) * 100}
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
				<h3 class="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
					{t?.('admin.analytics.resumesByLanguage') ?? 'Resumes by Language'}
				</h3>
				<div class="space-y-3">
					{#each byLang as lang}
						{@const pct = (lang.count / maxValue(byLang)) * 100}
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
				<h3 class="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
					{t?.('admin.analytics.topSections') ?? 'Most Used Sections'}
				</h3>
				<div class="space-y-2">
					{#each sections as section}
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-800 dark:text-neutral-200">{section.title}</span>
							<span class="text-gray-500 dark:text-neutral-500">{section.count}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Import Sources -->
			<div class="rounded-xl border p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<h3 class="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
					{t?.('admin.analytics.importSources') ?? 'Import Sources'}
				</h3>
				<div class="space-y-2">
					{#each imports as src}
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-800 dark:text-neutral-200">{src.source}</span>
							<span class="text-gray-500 dark:text-neutral-500">{src.count}</span>
						</div>
					{/each}
					{#if imports.length === 0}
						<p class="text-xs text-gray-500 dark:text-neutral-500">No imports yet</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
