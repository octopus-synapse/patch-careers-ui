<script lang="ts">
  /**
   * Admin onboarding — burra: lista steps + delete.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    deleteV1AdminOnboardingStepsKey,
    createGetV1AdminOnboardingSteps,
    createGetV1AdminOnboardingStats,
    getV1AdminOnboardingStepsQueryKey,
  } from 'api-client';
  import { Trash2 } from 'lucide-svelte';
  import { locale } from '$lib/state/locale.svelte';
  import { Button, Loader, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';
  import StatCard from '../_components/stat-card.svelte';

  const t = $derived(locale.t);
  const queryClient = useQueryClient();

  const stepsQuery = createGetV1AdminOnboardingSteps({
      query: { enabled: browser, refetchOnWindowFocus: false },
    });
  const statsQuery = createGetV1AdminOnboardingStats({
      query: { enabled: browser, refetchOnWindowFocus: false },
    });

  const steps = $derived($stepsQuery.data?.steps);
  const stats = $derived($statsQuery.data?.stats);

  let deletingKey = $state<string | null>(null);
  async function handleDelete(key: string) {
    deletingKey = key;
    try {
      await deleteV1AdminOnboardingStepsKey(key);
      toastState.show(t('actions.deletedStep'), 'success');
      await queryClient.invalidateQueries({ queryKey: getV1AdminOnboardingStepsQueryKey() });
    } catch (err) {
      handleApiError(err);
    } finally {
      deletingKey = null;
    }
  }
</script>

<svelte:head>
  <title>{t('admin.onboarding.title')}</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
    {t('admin.onboarding.title')}
  </h1>

  {#if stats}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard label={t('admin.onboarding.completionRate')} value={`${stats.completionRate}%`} />
      <StatCard label={t('admin.onboarding.totalStarted')} value={stats.totalStarted} />
      <StatCard label={t('admin.onboarding.totalCompleted')} value={stats.totalCompleted} />
    </div>
  {/if}

  <h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
    {t('admin.onboarding.steps')}
  </h2>

  {#if $stepsQuery.isLoading}
    <div class="flex items-center justify-center py-12"><Loader size={20} /></div>
  {:else}
    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">{t('admin.onboarding.stepKey')}</th>
            <th class="px-3 py-2">{t('admin.onboarding.stepLabel')}</th>
            <th class="px-3 py-2">{t('admin.onboarding.order')}</th>
            <th class="px-3 py-2">{t('admin.onboarding.isActive')}</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#if steps && steps.length > 0}
            {#each steps as step}
              <tr class="border-t border-border">
                <td class="px-3 py-2 font-mono text-xs">{step.key}</td>
                <td class="px-3 py-2 text-xs">{step.component}</td>
                <td class="px-3 py-2 text-xs">{step.order}</td>
                <td class="px-3 py-2 text-xs">{step.isActive ? 'Sim' : 'Não'}</td>
                <td class="px-3 py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onclick={() => handleDelete(step.key)}
                    disabled={deletingKey === step.key}
                  >
                    <Trash2 class="size-3" />
                  </Button>
                </td>
              </tr>
            {/each}
          {:else}
            <tr><td colspan="5" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.onboarding.noSteps')}</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>
