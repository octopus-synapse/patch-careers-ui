<script lang="ts">
	import {
		createAdminDashboardGetMetrics,
		createPlatformCheck,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { locale } from '$lib/locale.svelte';
	import { Users, FileText, Eye, UserCheck, TrendingUp, CalendarPlus, Target, Loader2 } from 'lucide-svelte';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';

	const t = $derived(locale.t);

	const metricsQuery = createAdminDashboardGetMetrics(() => ({
		query: { enabled: browser, refetchInterval: 30000 }
	}));

	const healthAll = createPlatformCheck(() => ({
		query: { enabled: browser, refetchInterval: 30000 }
	}));

	const metrics = $derived(metricsQuery.data);
	const healthStatus = $derived<'healthy' | 'down'>(
		healthAll.isError ? 'down' : (healthAll.data?.status === 'ok' ? 'healthy' : 'down')
	);
</script>

<svelte:head>
	<title>{t('admin.dashboard.title')}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
			{t('admin.dashboard.title')}
		</h1>
		<div class="flex items-center gap-2">
			<span class="text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-neutral-500">
				{t('admin.dashboard.systemHealth')}
			</span>
			{#if healthAll.isLoading}
				<Loader2 size={12} class="animate-spin text-gray-500 dark:text-neutral-500" />
			{:else}
				<StatusBadge status={healthStatus} />
			{/if}
		</div>
	</div>

	{#if metricsQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
		</div>
	{:else if metrics}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			<StatCard
				label={t('admin.dashboard.totalUsers')}
				value={metrics.totalUsers}
			>
				{#snippet icon()}<Users size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard
				label={t('admin.dashboard.totalResumes')}
				value={metrics.totalResumes}
			>
				{#snippet icon()}<FileText size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard
				label={t('admin.dashboard.totalViews')}
				value={metrics.totalViews}
			>
				{#snippet icon()}<Eye size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard
				label={t('admin.dashboard.activeWeek')}
				value={metrics.activeUsers7d}
			>
				{#snippet icon()}<UserCheck size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard
				label={t('admin.dashboard.signupsWeek')}
				value={metrics.signupsThisWeek}
			>
				{#snippet icon()}<CalendarPlus size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard
				label={t('admin.dashboard.signupsMonth')}
				value={metrics.signupsThisMonth}
			>
				{#snippet icon()}<TrendingUp size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard
				label={t('admin.dashboard.avgAtsScore')}
				value={metrics.averageAtsScore}
			>
				{#snippet icon()}<Target size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard
				label={t('admin.dashboard.onboardingRate')}
				value={`${metrics.onboardingCompletionRate}%`}
			/>
		</div>
	{/if}
</div>
