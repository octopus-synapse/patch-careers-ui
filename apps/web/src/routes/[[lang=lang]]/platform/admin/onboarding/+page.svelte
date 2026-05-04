<script lang="ts">
  /**
   * Admin onboarding — burra: lista steps + delete. Backend retorna `void`
   * no schema OpenAPI; cast local da resposta.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    adminOnboardingStepsDelete,
    createAdminOnboardingStepsGet,
    createAdminOnboardingStats,
    adminOnboardingStepsGetQueryKey,
  } from 'api-client';
  import { Trash2 } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { browser } from '$app/environment';
  import StatCard from '../_components/stat-card.svelte';
  import { locale } from '$lib/state/locale.svelte';

  type Step = {
    key: string;
    label?: string;
    order?: number;
    isActive?: boolean;
  };

  type Stats = {
    completionRate?: number;
    totalStarted?: number;
    totalCompleted?: number;
  };

  const t = $derived(locale.t);
  const queryClient = useQueryClient();

  const stepsQuery = createAdminOnboardingStepsGet({
      query: { enabled: browser, refetchOnWindowFocus: false },
    });
  const statsQuery = createAdminOnboardingStats({
      query: { enabled: browser, refetchOnWindowFocus: false },
    });

  const steps = $derived(
    (($stepsQuery.data as unknown as { items?: Step[] } | undefined)?.items ?? []) as Step[],
  );
  const stats = $derived($statsQuery.data as unknown as Stats | undefined);

  let deletingKey = $state<string | null>(null);
  async function handleDelete(key: string) {
    deletingKey = key;
    try {
      await adminOnboardingStepsDelete(key);
      toastState.show('Step excluído', 'success');
      await queryClient.invalidateQueries({ queryKey: adminOnboardingStepsGetQueryKey() });
    } catch {
      toastState.show('Falha ao excluir', 'danger');
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
      <StatCard label={t('admin.onboarding.completionRate')} value={`${stats.completionRate ?? 0}%`} />
      <StatCard label={t('admin.onboarding.totalStarted')} value={stats.totalStarted ?? 0} />
      <StatCard label={t('admin.onboarding.totalCompleted')} value={stats.totalCompleted ?? 0} />
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
          {#each steps as step}
            <tr class="border-t border-border">
              <td class="px-3 py-2 font-mono text-xs">{step.key}</td>
              <td class="px-3 py-2 text-xs">{step.label ?? '—'}</td>
              <td class="px-3 py-2 text-xs">{step.order ?? '—'}</td>
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
          {:else}
            <tr><td colspan="5" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.onboarding.noSteps')}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
