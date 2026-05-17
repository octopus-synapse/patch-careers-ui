<script lang="ts">
  /**
   * Admin analytics — burra: query SDK e renderiza cards.
   */
  import { createGetV1AdminAnalyticsOverview, createGetV1AdminDashboardMetrics } from 'api-client';
  import { browser } from '$app/environment';
  import { Card, Loader } from 'ui';
  import StatCard from '../_components/stat-card.svelte';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);

  let period = $state<'day' | 'week' | 'month'>('day');

  // svelte-ignore state_referenced_locally
  const analyticsQuery = createGetV1AdminAnalyticsOverview(
    { period },
    { query: { enabled: () => browser} },
  );

  const metricsQuery = createGetV1AdminDashboardMetrics({
      query: { enabled: browser },
    });

  const data = $derived($analyticsQuery.data);
  const metrics = $derived($metricsQuery.data);

  function maxValue(arr: { count: number }[]): number {
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
        value={metrics.signupsThisWeek}
      />
      <StatCard
        label={t('admin.dashboard.signupsMonth')}
        value={metrics.signupsThisMonth}
      />
      <StatCard
        label={t('admin.dashboard.avgAtsScore')}
        value={metrics.averageAtsScore}
      />
      <StatCard
        label={t('admin.dashboard.onboardingRate')}
        value={`${metrics.onboardingCompletionRate}%`}
      />
    </div>
  {/if}

  {#if $analyticsQuery.isLoading}
    <div class="flex items-center justify-center py-20">
      <Loader size={24} />
    </div>
  {:else if data}
    <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard label="DAU" value={data.activeUsers.dau} />
      <StatCard label="MAU" value={data.activeUsers.mau} />
      <StatCard
        label={t('admin.analytics.statDauMau')}
        value={data.activeUsers.mau > 0
          ? `${Math.round((data.activeUsers.dau / data.activeUsers.mau) * 100)}%`
          : '—'}
      />
    </div>

    <div class="grid grid-cols-3 gap-3 sm:gap-4">
      <StatCard label="Posts" value={data.contentStats.posts} />
      <StatCard label="Comments" value={data.contentStats.comments} />
      <StatCard label="Reactions" value={data.contentStats.reactions} />
    </div>

    <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      <StatCard label={t('admin.analytics.statPendingInvites')} value={data.socialStats.pendingInvitations} />
      <StatCard label="Accepted" value={data.socialStats.acceptedConnections} />
      <StatCard label="Rejected" value={data.socialStats.rejectedConnections} />
      <StatCard label={t('admin.analytics.statAcceptanceRate')} value={`${data.socialStats.acceptanceRate}%`} />
      <StatCard label="Blocked" value={data.socialStats.blockedUsers} />
    </div>

    <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      <StatCard label={t('admin.analytics.statJobsPosted')} value={data.jobStats.postedJobs} />
      <StatCard label={t('admin.analytics.statActiveJobs')} value={data.jobStats.activeJobs} />
      <StatCard label="Applications" value={data.jobStats.applications} />
      <StatCard label="Withdrawn" value={data.jobStats.withdrawn} />
      <StatCard label={t('admin.analytics.statAppsPerJob')} value={data.jobStats.applicationsPerJob} />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {#if data.atsScoreDistribution.length}
        <Card>
          <h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
            {t('admin.analytics.atsDistribution')}
          </h3>
          <div class="flex items-end gap-1 sm:gap-2 h-[100px] min-h-[80px]">
            {#each data.atsScoreDistribution as bucket}
              {@const pct = (bucket.count / maxValue(data.atsScoreDistribution)) * 100}
              <div class="flex flex-1 flex-col items-center gap-1">
                <span class="text-[9px] text-gray-500 dark:text-neutral-500">{bucket.count}</span>
                <div
                  class="w-full rounded-t bg-gray-700 dark:bg-neutral-400 min-h-[2px]"
                  style:height={`${pct}%`}
                ></div>
                <span class="text-[9px] text-gray-500 dark:text-neutral-500">{bucket.bucket}</span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      {#if data.resumesByLanguage.length}
        <Card>
          <h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
            {t('admin.analytics.resumesByLanguage')}
          </h3>
          <div class="space-y-3">
            {#each data.resumesByLanguage as lang}
              {@const pct = (lang.count / maxValue(data.resumesByLanguage)) * 100}
              <div>
                <div class="flex items-center justify-between text-xs text-gray-800 dark:text-neutral-200">
                  <span>{lang.language}</span>
                  <span>{lang.count}</span>
                </div>
                <div class="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
                  <div
                    class="h-full rounded-full bg-gray-700 dark:bg-neutral-400"
                    style:width={`${pct}%`}
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      {#if data.mostUsedSections.length}
        <Card>
          <h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
            {t('admin.analytics.topSections')}
          </h3>
          <div class="space-y-2">
            {#each data.mostUsedSections as section}
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-800 dark:text-neutral-200">{section.title}</span>
                <span class="text-gray-500 dark:text-neutral-500">{section.count}</span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      {#if data.importSources.length}
        <Card>
          <h3 class="mb-4 text-xs font-semibold text-gray-500 dark:text-neutral-500">
            {t('admin.analytics.importSources')}
          </h3>
          <div class="space-y-2">
            {#each data.importSources as src}
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
