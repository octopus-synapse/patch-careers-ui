<script lang="ts">
  /**
   * Admin performance — burra: chama metrics overview e renderiza cards.
   * Backend devolve `void` no schema OpenAPI; cast local da resposta.
   */
  import { createAdminMetricsOverview } from 'api-client';
  import { Clock, Cpu, HardDrive, RefreshCw, Zap } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { Card, Loader } from 'ui';
  import StatCard from '../_components/stat-card.svelte';

  type LatencyRow = { route: string; totalRequests: number; avgLatencyMs: number };
  type MetricsOverview = {
    counters?: {
      resumeCreated?: number;
      userSignups?: number;
      exportCompleted?: number;
    };
    gauges?: {
      activeUsers?: number;
      pendingExports?: number;
    };
    process?: {
      uptimeSeconds?: number;
      heapUsedMb?: number;
      heapTotalMb?: number;
      eventLoopLagMs?: number;
    };
    latency?: LatencyRow[];
  };

  const metricsQuery = createAdminMetricsOverview(() => ({
    query: { enabled: browser, refetchInterval: 10_000 },
  }));

  const data = $derived(metricsQuery.data as unknown as MetricsOverview | undefined);
  const counters = $derived(data?.counters);
  const gauges = $derived(data?.gauges);
  const proc = $derived(data?.process);
  const latency = $derived(data?.latency ?? []);

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
    latency.length ? Math.max(...latency.map((r) => r.totalRequests), 1) : 1,
  );
</script>

<svelte:head>
  <title>Performance</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
      Performance
    </h1>
    <div class="flex items-center gap-2 text-gray-500 dark:text-neutral-500">
      <RefreshCw size={12} class="animate-spin" />
      <span class="text-xs font-medium">Auto-refresh: 10s</span>
    </div>
  </div>

  {#if metricsQuery.isLoading}
    <div class="flex items-center justify-center py-20">
      <Loader size={24} />
    </div>
  {:else if data}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
      <StatCard label="Uptime" value={formatUptime(proc?.uptimeSeconds ?? 0)}>
        {#snippet icon()}<Clock size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
      </StatCard>
      <StatCard label="Heap Used" value={`${proc?.heapUsedMb ?? 0} MB`}>
        {#snippet icon()}<HardDrive size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
      </StatCard>
      <StatCard label="Heap Total" value={`${proc?.heapTotalMb ?? 0} MB`}>
        {#snippet icon()}<Cpu size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
      </StatCard>
      <StatCard label="Event Loop Lag" value={`${proc?.eventLoopLagMs ?? 0} ms`}>
        {#snippet icon()}<Zap size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
      </StatCard>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
      <StatCard label="Resumes Created" value={counters?.resumeCreated ?? 0} />
      <StatCard label="User Signups" value={counters?.userSignups ?? 0} />
      <StatCard label="Exports Done" value={counters?.exportCompleted ?? 0} />
      <StatCard label="Active Users" value={gauges?.activeUsers ?? 0} />
      <StatCard label="Pending Exports" value={gauges?.pendingExports ?? 0} />
    </div>

    <div>
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
        Endpoint Latency
      </h2>

      {#if latency.length}
        <div class="rounded-xl border border-border">
          <table class="w-full text-sm">
            <thead class="bg-muted/40">
              <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
                <th class="px-3 py-2">Endpoint</th>
                <th class="px-3 py-2">Requests</th>
                <th class="px-3 py-2">Avg Latency</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {#each latency as row}
                {@const pct = (row.totalRequests / maxRequests) * 100}
                <tr class="border-t border-border">
                  <td class="px-3 py-2 font-mono text-xs">{row.route}</td>
                  <td class="px-3 py-2 font-mono text-xs">{row.totalRequests}</td>
                  <td class="px-3 py-2 font-mono text-xs {latencyColor(row.avgLatencyMs)}">{row.avgLatencyMs} ms</td>
                  <td class="px-3 py-2">
                    <div class="h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
                      <div
                        class="h-full rounded-full bg-gray-700 dark:bg-neutral-400"
                        style="width: {pct}%"
                      ></div>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <Card class="p-8 text-center">
          <p class="text-sm text-gray-500 dark:text-neutral-500">No API requests recorded yet.</p>
        </Card>
      {/if}
    </div>
  {/if}
</div>
