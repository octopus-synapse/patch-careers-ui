<!--
  Resume analytics — view stats + recent viewers for the owner. Uses
  resumeAnalyticsGetViewStats from the generated client.
-->
<script lang="ts">
import { createGetV1ResumesResumeIdAnalyticsViews } from 'api-client';
import { Eye, TrendingUp, Users } from 'lucide-svelte';
import { Skeleton } from 'ui';
import { browser } from '$app/environment';
import { page } from '$app/stores';

const resumeId = $derived($page.params.id ?? '');

const stats = createGetV1ResumesResumeIdAnalyticsViews(() => resumeId,
  { period: 'month' },
  { query: { enabled: () => browser && Boolean(resumeId)} },
);

interface ViewStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  topReferrers: Array<{ referrer: string; count: number }>;
  recentViewers?: Array<{
    userId: string | null;
    name: string | null;
    username: string | null;
    photoURL: string | null;
    viewedAt: string;
  }>;
  dailyBreakdown?: Array<{ date: string; count: number }>;
}

const data = $derived.by<ViewStats | null>(() => {
  const d = $stats.data as Record<string, unknown> | undefined;
  return (d?.stats as ViewStats | undefined) ?? (d as ViewStats | undefined) ?? null;
});
</script>

<svelte:head>
  <title>Analytics do currículo · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">Analytics</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Quem viu seu currículo, quando e de onde.
    </p>
  </header>

  {#if $stats.isLoading}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {#each Array(4) as _}
        <div class="rounded-xl border border-gray-200 p-4 dark:border-neutral-800">
          <Skeleton shape="text" width="60%" />
          <Skeleton shape="text" width="40%" />
        </div>
      {/each}
    </div>
  {:else if !data}
    <p class="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
      Sem dados de analytics ainda.
    </p>
  {:else}
    <!-- Summary cards -->
    <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-gray-200 p-4 dark:border-neutral-800">
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500">
          <Eye size={14} />
          Visualizações totais
        </div>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-neutral-100">
          {data.totalViews ?? 0}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 p-4 dark:border-neutral-800">
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500">
          <Users size={14} />
          Visitantes únicos
        </div>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-neutral-100">
          {data.uniqueVisitors ?? 0}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 p-4 dark:border-neutral-800">
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500">
          <TrendingUp size={14} />
          Últimos 7 dias
        </div>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-neutral-100">
          {data.viewsLast7Days ?? 0}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 p-4 dark:border-neutral-800">
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500">
          <TrendingUp size={14} />
          Últimos 30 dias
        </div>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-neutral-100">
          {data.viewsLast30Days ?? 0}
        </p>
      </div>
    </div>

    <!-- Top referrers -->
    {#if data.topReferrers?.length}
      <section class="mb-8">
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          Principais origens
        </h2>
        <ul class="space-y-2">
          {#each data.topReferrers as r}
            <li class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-neutral-800">
              <span class="truncate text-gray-700 dark:text-neutral-300">
                {r.referrer || '(direto)'}
              </span>
              <span class="text-gray-500 dark:text-neutral-500">{r.count}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <!-- Recent viewers -->
    {#if data.recentViewers?.length}
      <section>
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          Visualizações recentes
        </h2>
        <ul class="space-y-2">
          {#each data.recentViewers as v}
            <li class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-neutral-800">
              <img
                src={v.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name ?? v.username ?? '?')}`}
                alt=""
                class="h-9 w-9 rounded-full"
              />
              <div class="flex-1">
                {#if v.username}
                  <a
                    href="/my-profile/public/@{v.username}"
                    class="text-sm font-medium text-gray-900 hover:underline dark:text-neutral-100"
                  >
                    {v.name ?? v.username}
                  </a>
                {:else}
                  <span class="text-sm text-gray-500 dark:text-neutral-500">Visitante anônimo</span>
                {/if}
                <p class="text-[11px] text-gray-400 dark:text-neutral-600">
                  {new Date(v.viewedAt).toLocaleString()}
                </p>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>
