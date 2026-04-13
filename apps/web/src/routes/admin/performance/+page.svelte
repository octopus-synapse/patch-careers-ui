<script lang="ts">
	import { createAdminMetricsGetOverview } from 'api-client';
	import { browser } from '$app/environment';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { Loader2, RefreshCw, Clock, Cpu, HardDrive, Zap } from 'lucide-svelte';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import ExportButton from '$lib/components/admin/export-button.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');
	const barColor = $derived(cs === 'dark' ? '#a3a3a3' : '#374151');

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
		<h1 class="text-xl font-semibold tracking-tight {text}">Performance</h1>
		<div class="flex items-center gap-3">
			<ExportButton data={latency} filename="performance.csv" colorSchema={cs} />
			<div class="flex items-center gap-2 {muted}">
				<RefreshCw size={12} class="animate-spin" />
				<span class="text-[10px] font-medium uppercase tracking-widest">Auto-refresh: 10s</span>
			</div>
		</div>
	</div>

	{#if metricsQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={24} class="animate-spin {muted}" />
		</div>
	{:else if rawData}
		<!-- Process Stats -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<StatCard label="Uptime" value={formatUptime(process.uptimeSeconds ?? 0)} colorSchema={cs}>
				{#snippet icon()}<Clock size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard label="Heap Used" value={`${process.heapUsedMb ?? 0} MB`} colorSchema={cs}>
				{#snippet icon()}<HardDrive size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard label="Heap Total" value={`${process.heapTotalMb ?? 0} MB`} colorSchema={cs}>
				{#snippet icon()}<Cpu size={18} class={muted} />{/snippet}
			</StatCard>
			<StatCard label="Event Loop Lag" value={`${process.eventLoopLagMs ?? 0} ms`} colorSchema={cs}>
				{#snippet icon()}<Zap size={18} class={muted} />{/snippet}
			</StatCard>
		</div>

		<!-- Business Counters -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-5">
			<StatCard label="Resumes Created" value={counters.resumeCreated ?? 0} colorSchema={cs} />
			<StatCard label="User Signups" value={counters.userSignups ?? 0} colorSchema={cs} />
			<StatCard label="Exports Done" value={counters.exportCompleted ?? 0} colorSchema={cs} />
			<StatCard label="Active Users" value={gauges.activeUsers ?? 0} colorSchema={cs} />
			<StatCard label="Pending Exports" value={gauges.pendingExports ?? 0} colorSchema={cs} />
		</div>

		<!-- Latency per Route -->
		<div>
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest {muted}">
				Endpoint Latency
			</h2>

			{#if latency.length > 0}
				<DataTable
					{columns}
					data={latency}
					emptyMessage="No requests recorded yet"
					colorSchema={cs}
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
							<div class="h-2 w-full rounded-full {cs === 'dark' ? 'bg-neutral-700' : 'bg-gray-200'}">
								<div class="h-full rounded-full" style="width: {pct}%; background: {barColor}"></div>
							</div>
						{:else}
							{row[key] ?? '—'}
						{/if}
					{/snippet}
				</DataTable>
			{:else}
				<div class="rounded-xl border p-8 text-center {cardBg} {cardBorder}">
					<p class="text-sm {muted}">No API requests recorded yet.</p>
					<p class="mt-1 text-xs {muted}">The MetricsInterceptor is now active. Data will appear after requests are made.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
