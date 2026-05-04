<script lang="ts">
  /**
   * Admin home — burra: chama SDK e renderiza StatCards.
   * Backend (T11) ainda retorna `void` no schema OpenAPI; esperamos a forma
   * documentada e fazemos cast local. Quando o backend tipar a response,
   * basta remover o cast.
   */
  import { createAdminDashboardMetrics } from 'api-client';
  import {
    CalendarPlus,
    Eye,
    FileText,
    Target,
    TrendingUp,
    UserCheck,
    Users,
  } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import AdminAlerts from './_components/admin-alerts.svelte';
  import StatCard from './_components/stat-card.svelte';
  import StatCardSkeleton from './_components/stat-card-skeleton.svelte';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);

  type DashboardMetrics = {
    totalUsers?: number;
    totalResumes?: number;
    totalViews?: number;
    activeUsers7d?: number;
    signupsThisWeek?: number;
    signupsThisMonth?: number;
    averageAtsScore?: number;
    onboardingCompletionRate?: number;
  };

  const metricsQuery = createAdminDashboardMetrics({
      query: { enabled: browser, refetchInterval: 30_000 },
    });

  const metrics = $derived($metricsQuery.data as unknown as DashboardMetrics | undefined);
</script>

<svelte:head>
  <title>{t('admin.dashboard.title')}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
      {t('admin.dashboard.title')}
    </h1>
    <a
      href="/platform/admin/health"
      class="text-xs font-medium text-primary hover:underline"
    >
      {t('admin.dashboard.systemHealth')} →
    </a>
  </div>

  <AdminAlerts />

  {#if $metricsQuery.isLoading}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {#each Array(8) as _}
        <StatCardSkeleton />
      {/each}
    </div>
  {:else if metrics}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard label={t('admin.dashboard.totalUsers')} value={metrics.totalUsers ?? 0}>
        {#snippet icon()}<Users size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
      </StatCard>
      <StatCard label={t('admin.dashboard.totalResumes')} value={metrics.totalResumes ?? 0}>
        {#snippet icon()}<FileText size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
      </StatCard>
      <StatCard label={t('admin.dashboard.totalViews')} value={metrics.totalViews ?? 0}>
        {#snippet icon()}<Eye size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
      </StatCard>
      <StatCard label={t('admin.dashboard.activeWeek')} value={metrics.activeUsers7d ?? 0}>
        {#snippet icon()}
          <UserCheck size={18} class="text-gray-500 dark:text-neutral-500" />
        {/snippet}
      </StatCard>
      <StatCard label={t('admin.dashboard.signupsWeek')} value={metrics.signupsThisWeek ?? 0}>
        {#snippet icon()}
          <CalendarPlus size={18} class="text-gray-500 dark:text-neutral-500" />
        {/snippet}
      </StatCard>
      <StatCard label={t('admin.dashboard.signupsMonth')} value={metrics.signupsThisMonth ?? 0}>
        {#snippet icon()}
          <TrendingUp size={18} class="text-gray-500 dark:text-neutral-500" />
        {/snippet}
      </StatCard>
      <StatCard label={t('admin.dashboard.avgAtsScore')} value={metrics.averageAtsScore ?? 0}>
        {#snippet icon()}<Target size={18} class="text-gray-500 dark:text-neutral-500" />{/snippet}
      </StatCard>
      <StatCard
        label={t('admin.dashboard.onboardingRate')}
        value={`${metrics.onboardingCompletionRate ?? 0}%`}
      />
    </div>
  {/if}
</div>
