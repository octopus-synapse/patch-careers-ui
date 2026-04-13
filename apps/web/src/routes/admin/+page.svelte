<script lang="ts">
	import {
		createAdminDashboardGetMetrics,
		createPlatformCheck,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { Users, FileText, Eye, UserCheck, TrendingUp, CalendarPlus, Target, Loader2 } from 'lucide-svelte';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');

	const metricsQuery = createAdminDashboardGetMetrics(() => ({
		query: { enabled: browser, refetchInterval: 30000 }
	}));

	const healthAll = createPlatformCheck(() => ({
		query: { enabled: browser, refetchInterval: 30000 }
	}));

	const metrics = $derived(
		((metricsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined
	);
	const healthStatus = $derived<'healthy' | 'down'>(
		healthAll.isError ? 'down' : (healthAll.data?.data?.status === 'ok' ? 'healthy' : 'down')
	);
</script>

<svelte:head>
	<title>{t?.('admin.dashboard.title') ?? 'Admin Dashboard'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight {text}">
			{t?.('admin.dashboard.title') ?? 'Dashboard'}
		</h1>
		<div class="flex items-center gap-2">
			<span class="text-[10px] font-medium uppercase tracking-widest {muted}">
				{t?.('admin.dashboard.systemHealth') ?? 'System Health'}
			</span>
			{#if healthAll.isLoading}
				<Loader2 size={12} class="animate-spin {muted}" />
			{:else}
				<StatusBadge status={healthStatus} colorSchema={cs} />
			{/if}
		</div>
	</div>

	{#if metricsQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={24} class="animate-spin {muted}" />
		</div>
	{:else if metrics}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			<StatCard
				label={t?.('admin.dashboard.totalUsers') ?? 'Total Users'}
				value={metrics.totalUsers as number}
				colorSchema={cs}
			>
				{#snippet icon()}<Users size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard
				label={t?.('admin.dashboard.totalResumes') ?? 'Total Resumes'}
				value={metrics.totalResumes as number}
				colorSchema={cs}
			>
				{#snippet icon()}<FileText size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard
				label={t?.('admin.dashboard.totalViews') ?? 'Total Views'}
				value={metrics.totalViews as number}
				colorSchema={cs}
			>
				{#snippet icon()}<Eye size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard
				label={t?.('admin.dashboard.activeWeek') ?? 'Active This Week'}
				value={metrics.activeUsers7d as number}
				colorSchema={cs}
			>
				{#snippet icon()}<UserCheck size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard
				label={t?.('admin.dashboard.signupsWeek') ?? 'Signups This Week'}
				value={metrics.signupsThisWeek as number}
				colorSchema={cs}
			>
				{#snippet icon()}<CalendarPlus size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard
				label={t?.('admin.dashboard.signupsMonth') ?? 'Signups This Month'}
				value={metrics.signupsThisMonth as number}
				colorSchema={cs}
			>
				{#snippet icon()}<TrendingUp size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard
				label={t?.('admin.dashboard.avgAtsScore') ?? 'Avg ATS Score'}
				value={metrics.averageAtsScore as number}
				colorSchema={cs}
			>
				{#snippet icon()}<Target size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard
				label={t?.('admin.dashboard.onboardingRate') ?? 'Onboarding Rate'}
				value={`${metrics.onboardingCompletionRate}%`}
				colorSchema={cs}
			/>
		</div>
	{/if}
</div>
