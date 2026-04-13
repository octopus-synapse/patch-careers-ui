<script lang="ts">
	import { createAdminMetricsGetOverview } from 'api-client';
	import { browser } from '$app/environment';
	import { locale } from '$lib/locale.svelte';
	import { Loader2, RefreshCw, Clock, Cpu, HardDrive, Zap } from 'lucide-svelte';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import ExportButton from '$lib/components/admin/export-button.svelte';

	const t = $derived(locale.t);

	const metricsQuery = createAdminMetricsGetOverview(() => ({
		query: { enabled: browser, refetchInterval: 10000 }
	}));

	const rawData = $derived(
		((metricsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined
	);
	const counters = $derived((rawData?.counters as Record<string, number> | undefined) ?? {});
	const gauges = $derived((rawData?.gauges as Record<string, number> | undefined) ?? {});
	const process = $derived((rawData?.process as Record<string, number> | undefined) ?? {});
	const latency = $derived((rawData?.latency as Record<string, unknown>[] | undefined) ?? []);

	function formatUptime(seconds: number): string {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		if (days > 0) return `${days}d ${hours}h ${mins}m`;
		if (hours > 0) return `${hours}h ${mins}m`;
		return `${mins}m`;
	}

	function latencyColor(avgMs: number): string {
		if (avgMs < 50) return 'text-emerald-500';
		if (avgMs < 200) return 'text-amber-500';
		return 'text-red-500';
	}

	const maxRequests = $derived(
		latency.length > 0 ? Math.max(...latency.map(r => r.totalRequests as number), 1) : 1
	);

	const columns = [
		{ key: 'route', label: 'Endpoint' },
		{ key: 'totalRequests', label: 'Requests', width: '100px' },
		{ key: 'avgLatencyMs', label: 'Avg Latency', width: '120px' },
		{ key: 'bar', label: '', width: '200px' },
	];
</script>

<svelte:head>
	<title>Performance</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">Performance</h1>
		<div class="flex items-center gap-3">
			<ExportButton data={latency} filename="performance.csv" />
			<div class="flex items-center gap-2 text-gray-500 dark:text-neutral-500">
				<RefreshCw size={12} class="animate-spin" />
				<span class="text-[10px] font-medium uppercase tracking-widest">Auto-refresh: 10s</span>
			</div>
		</div>
	</div>

	{#if metricsQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
		</div>
	{:else if rawData}
		<!-- Process Stats -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<StatCard label="Uptime" value={formatUptime(process.uptimeSeconds ?? 0)}>
				{#snippet icon()}<Clock size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard label="Heap Used" value={`${process.heapUsedMb ?? 0} MB`}>
				{#snippet icon()}<HardDrive size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard label="Heap Total" value={`${process.heapTotalMb ?? 0} MB`}>
				{#snippet icon()}<Cpu size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
			<StatCard label="Event Loop Lag" value={`${process.eventLoopLagMs ?? 0} ms`}>
				{#snippet icon()}<Zap size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
			</StatCard>
		</div>

		<!-- Business Counters -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-5">
			<StatCard label="Resumes Created" value={counters.resumeCreated ?? 0} />
			<StatCard label="User Signups" value={counters.userSignups ?? 0} />
			<StatCard label="Exports Done" value={counters.exportCompleted ?? 0} />
			<StatCard label="Active Users" value={gauges.activeUsers ?? 0} />
			<StatCard label="Pending Exports" value={gauges.pendingExports ?? 0} />
		</div>

		<!-- Latency per Route -->
		<div>
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
				Endpoint Latency
			</h2>

			{#if latency.length > 0}
				<DataTable
					{columns}
					data={latency}
					emptyMessage="No requests recorded yet"
				>
					{#snippet cell({ row, key })}
						{#if key === 'route'}
							<span class="font-mono text-xs">{row.route}</span>
						{:else if key === 'totalRequests'}
							<span class="font-mono text-xs">{row.totalRequests}</span>
						{:else if key === 'avgLatencyMs'}
							<span class="font-mono text-xs {latencyColor(row.avgLatencyMs as number)}">
								{row.avgLatencyMs} ms
							</span>
						{:else if key === 'bar'}
							{@const pct = ((row.totalRequests as number) / maxRequests) * 100}
							<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
								<div class="h-full rounded-full bg-gray-700 dark:bg-neutral-400" style="width: {pct}%"></div>
							</div>
						{:else}
							{row[key] ?? '—'}
						{/if}
					{/snippet}
				</DataTable>
			{:else}
				<div class="rounded-xl border p-8 text-center bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
					<p class="text-sm text-gray-500 dark:text-neutral-500">No API requests recorded yet.</p>
					<p class="mt-1 text-xs text-gray-500 dark:text-neutral-500">The MetricsInterceptor is now active. Data will appear after requests are made.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
