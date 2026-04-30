<script lang="ts">
  /**
   * Admin analytics — burra: query SDK e renderiza cards. Backend devolve
   * shape ainda não tipado (response: void no OpenAPI), por isso cast local.
   */
  import { createAdminAnalyticsOverview, createAdminDashboardMetrics } from 'api-client';
  import { browser } from '$app/environment';
  import { Card, Loader } from 'ui';
  import StatCard from '../_components/stat-card.svelte';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);

  let period = $state<'day' | 'week' | 'month'>('day');

  type Bucket = { bucket: string; count: number };
  type Counted = { count: number };
  type AnalyticsOverview = {
    atsScoreDistribution?: Bucket[];
    resumesByLanguage?: { language: string; count: number }[];
    mostUsedSections?: { title: string; count: number }[];
    importSources?: { source: string; count: number }[];
    activeUsers?: { dau: number; mau: number };
    contentStats?: { posts: number; comments: number; reactions: number };
    socialStats?: {
      pendingInvitations: number;
      acceptedConnections: number;
      rejectedConnections: number;
      acceptanceRate: number;
      blockedUsers: number;
    };
    jobStats?: {
      postedJobs: number;
      activeJobs: number;
      applications: number;
      withdrawn: number;
      applicationsPerJob: number;
    };
  };
  type DashboardMetrics = {
    signupsThisWeek?: number;
    signupsThisMonth?: number;
    averageAtsScore?: number;
    onboardingCompletionRate?: number;
  };

  const analyticsQuery = createAdminAnalyticsOverview(
    () => ({ period }),
    () => ({ query: { enabled: browser } }),
  );

  const metricsQuery = createAdminDashboardMetrics(() => ({
    query: { enabled: browser },
  }));

  const data = $derived(analyticsQuery.data as unknown as AnalyticsOverview | undefined);
  const metrics = $derived(metricsQuery.data as unknown as DashboardMetrics | undefined);

  const atsDist = $derived(data?.atsScoreDistribution ?? []);
  const byLang = $derived(data?.resumesByLanguage ?? []);
  const sections = $derived(data?.mostUsedSections ?? []);
  const imports = $derived(data?.importSources ?? []);
  const activeUsers = $derived(data?.activeUsers);
  const contentStats = $derived(data?.contentStats);
  const socialStats = $derived(data?.socialStats);
  const jobStats = $derived(data?.jobStats);

  function maxValue(arr: Counted[]): number {
    return Math.max(...arr.map((i) => i.count), 1);
  }
</script>

<svelte:head>
  <title>{t('admin.analytics.title')}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
      {t('admin.analytics.title')}
    </h1>
    <div class="flex items-center gap-2">
      {#each ['day', 'week', 'month'] as p}
        <button
          type="button"
          class="rounded-md border px-3 py-1 text-xs transition-colors {period === p
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-gray-500 hover:bg-muted dark:text-neutral-500'}"
          onclick={() => (period = p as 'day' | 'week' | 'month')}
        >
          {p}
        </button>
      {/each}
    </div>
  </div>

  {#if metrics}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
      <StatCard
        label={t('admin.dashboard.signupsWeek')}
        value={metrics.signupsThisWeek ?? 0}
      />
      <StatCard
        label={t('admin.dashboard.signupsMonth')}
        value={metrics.signupsThisMonth ?? 0}
      />
      <StatCard
        label={t('admin.dashboard.avgAtsScore')}
        value={metrics.averageAtsScore ?? 0}
      />
      <StatCard
        label={t('admin.dashboard.onboardingRate')}
        value={`${metrics.onboardingCompletionRate ?? 0}%`}
      />
    </div>
  {/if}

  {#if analyticsQuery.isLoading}
    <div class="flex items-center justify-center py-20">
      <Loader size={24} />
    </div>
  {:else if data}
    {#if activeUsers}
      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="DAU" value={activeUsers.dau} />
        <StatCard label="MAU" value={activeUsers.mau} />
        <StatCard
          label="DAU/MAU"
          value={activeUsers.mau > 0
            ? `${Math.round((activeUsers.dau / activeUsers.mau) * 100)}%`
            : '—'}
        />
      </div>
    {/if}

    {#if contentStats}
      <div class="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Posts" value={contentStats.posts} />
        <StatCard label="Comments" value={contentStats.comments} />
        <StatCard label="Reactions" value={contentStats.reactions} />
      </div>
    {/if}

    {#if socialStats}
      <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Pending invites" value={socialStats.pendingInvitations} />
        <StatCard label="Accepted" value={socialStats.acceptedConnections} />
        <StatCard label="Rejected" value={socialStats.rejectedConnections} />
        <StatCard label="Acceptance rate" value={`${socialStats.acceptanceRate}%`} />
        <StatCard label="Blocked" value={socialStats.blockedUsers} />
      </div>
    {/if}

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
      {#if atsDist.length}
        <Card>
          <h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
            {t('admin.analytics.atsDistribution')}
          </h3>
          <div class="flex items-end gap-1 sm:gap-2" style="height: 100px; min-height: 80px">
            {#each atsDist as bucket}
              {@const pct = (bucket.count / maxValue(atsDist)) * 100}
              <div class="flex flex-1 flex-col items-center gap-1">
                <span class="text-[9px] text-gray-500 dark:text-neutral-500">{bucket.count}</span>
                <div
                  class="w-full rounded-t bg-gray-700 dark:bg-neutral-400"
                  style="height: {pct}%; min-height: 2px"
                ></div>
                <span class="text-[9px] text-gray-500 dark:text-neutral-500">{bucket.bucket}</span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      {#if byLang.length}
        <Card>
          <h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
            {t('admin.analytics.resumesByLanguage')}
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
                  <div
                    class="h-full rounded-full bg-gray-700 dark:bg-neutral-400"
                    style="width: {pct}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      {#if sections.length}
        <Card>
          <h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
            {t('admin.analytics.topSections')}
          </h3>
          <div class="space-y-2">
            {#each sections as section}
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-800 dark:text-neutral-200">{section.title}</span>
                <span class="text-gray-500 dark:text-neutral-500">{section.count}</span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      {#if imports.length}
        <Card>
          <h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
            {t('admin.analytics.importSources')}
          </h3>
          <div class="space-y-2">
            {#each imports as src}
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-800 dark:text-neutral-200">{src.source}</span>
                <span class="text-gray-500 dark:text-neutral-500">{src.count}</span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}
    </div>
  {/if}
</div>
