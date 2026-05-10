<script lang="ts">
  /**
   * Feature flags admin — burra: lista flags + toggle ativo/inativo.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    postV1AdminFeatureFlagsBroadcastRefresh,
    patchV1AdminFeatureFlagsKey,
    createGetV1AdminFeatureFlags,
    getV1AdminFeatureFlagsQueryKey,
  } from 'api-client';
  import type { GetV1AdminFeatureFlags200 } from 'api-client';
  import { Loader, RefreshCw } from 'lucide-svelte';
  import { Button, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';

  type FlagRow = GetV1AdminFeatureFlags200['flags'][number];

  const queryClient = useQueryClient();

  const listQuery = createGetV1AdminFeatureFlags({
      query: { enabled: browser, refetchOnWindowFocus: false },
    });

  const flags = $derived($listQuery.data?.flags);

  let toggling = $state<string | null>(null);

  async function toggle(flag: FlagRow) {
    toggling = flag.key;
    try {
      await patchV1AdminFeatureFlagsKey(flag.key, { enabled: !flag.enabled });
      toastState.show('Flag atualizada', 'success');
      await queryClient.invalidateQueries({ queryKey: getV1AdminFeatureFlagsQueryKey() });
    } catch (err) {
      handleApiError(err);
    } finally {
      toggling = null;
    }
  }

  let broadcasting = $state(false);
  async function broadcast() {
    broadcasting = true;
    try {
      await postV1AdminFeatureFlagsBroadcastRefresh();
      toastState.show('Broadcast enviado', 'success');
    } catch (err) {
      handleApiError(err);
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
          {#if flags && flags.length}
            {#each flags as f}
              <tr class="border-t border-border">
                <td class="px-3 py-2 font-mono text-xs">{f.key}</td>
                <td class="px-3 py-2 text-xs text-gray-500 dark:text-neutral-500">{f.description ?? '—'}</td>
                <td class="px-3 py-2 text-xs">{f.enabledForRoles.join(', ') || '—'}</td>
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
            {/each}
          {:else}
            <tr><td colspan="4" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">Nenhuma flag</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>
