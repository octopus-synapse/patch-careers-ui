<script lang="ts">
  /**
   * Feature flags admin — burra: lista flags + toggle ativo/inativo.
   * Backend ainda devolve `void` no schema OpenAPI; cast local da resposta.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    adminFeatureFlagsBroadcastRefresh,
    adminFeatureFlagsUpdate,
    createAdminFeatureFlagsList,
    adminFeatureFlagsListQueryKey,
  } from 'api-client';
  import { Loader, RefreshCw } from 'lucide-svelte';
  import { Button, toastState } from 'ui';
  import { browser } from '$app/environment';

  type FlagRow = {
    key: string;
    description?: string;
    enabled?: boolean;
    enabledForRoles?: string[];
  };

  const queryClient = useQueryClient();

  const listQuery = createAdminFeatureFlagsList({
      query: { enabled: browser, refetchOnWindowFocus: false },
    });

  const flags = $derived(($listQuery.data as unknown as { items?: FlagRow[] } | undefined)?.items ?? []);

  let toggling = $state<string | null>(null);

  async function toggle(flag: FlagRow) {
    toggling = flag.key;
    try {
      await adminFeatureFlagsUpdate(flag.key, { enabled: !flag.enabled });
      toastState.show('Flag atualizada', 'success');
      await queryClient.invalidateQueries({ queryKey: adminFeatureFlagsListQueryKey() });
    } catch {
      toastState.show('Falha ao atualizar flag', 'danger');
    } finally {
      toggling = null;
    }
  }

  let broadcasting = $state(false);
  async function broadcast() {
    broadcasting = true;
    try {
      await adminFeatureFlagsBroadcastRefresh();
      toastState.show('Broadcast enviado', 'success');
    } catch {
      toastState.show('Falha ao enviar broadcast', 'danger');
    } finally {
      broadcasting = false;
    }
  }
</script>

<svelte:head>
  <title>{`Feature Flags`}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
      Feature Flags
    </h1>
    <Button size="sm" variant="outline" onclick={broadcast} disabled={broadcasting}>
      {#if broadcasting}<Loader class="size-3 animate-spin" />{:else}<RefreshCw class="size-3" />{/if}
      Broadcast refresh
    </Button>
  </div>

  {#if $listQuery.isLoading}
    <div class="flex items-center justify-center py-12"><Loader class="size-6 animate-spin" /></div>
  {:else}
    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">Key</th>
            <th class="px-3 py-2">Description</th>
            <th class="px-3 py-2">Roles</th>
            <th class="px-3 py-2 text-right">Enabled</th>
          </tr>
        </thead>
        <tbody>
          {#each flags as f}
            <tr class="border-t border-border">
              <td class="px-3 py-2 font-mono text-xs">{f.key}</td>
              <td class="px-3 py-2 text-xs text-gray-500 dark:text-neutral-500">{f.description ?? '—'}</td>
              <td class="px-3 py-2 text-xs">{(f.enabledForRoles ?? []).join(', ') || '—'}</td>
              <td class="px-3 py-2 text-right">
                <Button
                  size="sm"
                  variant={f.enabled ? 'solid' : 'outline'}
                  onclick={() => toggle(f)}
                  disabled={toggling === f.key}
                >
                  {f.enabled ? 'ON' : 'OFF'}
                </Button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">Nenhuma flag</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
