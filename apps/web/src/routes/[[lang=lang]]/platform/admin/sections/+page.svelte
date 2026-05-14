<script lang="ts">
  /**
   * Admin sections — burra: lista section types + delete.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    deleteV1AdminSectionTypesKey,
    createGetV1AdminSectionTypes,
    getV1AdminSectionTypesQueryKey,
  } from 'api-client';
  import { Trash2 } from 'lucide-svelte';
  import { locale } from '$lib/state/locale.svelte';
  const t = $derived(locale.t);
  import { Button, Loader, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';

  const queryClient = useQueryClient();

  let page = $state(1);
  let pageSize = $state(20);
  let search = $state('');

  // svelte-ignore state_referenced_locally
  const listQuery = createGetV1AdminSectionTypes(
    { page, limit: pageSize, search: search || undefined },
    { query: { enabled: () => browser} },
  );

  const items = $derived($listQuery.data?.items);
  const totalPages = $derived($listQuery.data?.totalPages ?? 1);

  let deleting = $state<string | null>(null);
  async function handleDelete(key: string) {
    deleting = key;
    try {
      await deleteV1AdminSectionTypesKey(key);
      toastState.show(t('actions.deletedSection'), 'success');
      await queryClient.invalidateQueries({ queryKey: getV1AdminSectionTypesQueryKey() });
    } catch (err) {
      handleApiError(err);
    } finally {
      deleting = null;
    }
  }
</script>

<svelte:head>
  <title>Sections</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
    {t('admin.sections.heading')}
  </h1>

  <input
    type="search"
    placeholder={t('admin.sections.searchPlaceholder')}
    bind:value={search}
    class="w-full max-w-sm rounded-md border border-border bg-background px-3 py-1.5 text-sm"
  />

  {#if $listQuery.isLoading}
    <div class="flex items-center justify-center py-12"><Loader size={20} /></div>
  {:else}
    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">Key</th>
            <th class="px-3 py-2">Label</th>
            <th class="px-3 py-2">Semântica</th>
            <th class="px-3 py-2">Sistema?</th>
            <th class="px-3 py-2">Ativo?</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#if items && items.length}
            {#each items as s}
              <tr class="border-t border-border">
                <td class="px-3 py-2 font-mono text-xs">{s.key}</td>
                <td class="px-3 py-2">{s.title}</td>
                <td class="px-3 py-2 text-xs">{s.semanticKind}</td>
                <td class="px-3 py-2 text-xs">{s.isSystem ? 'Sim' : 'Não'}</td>
                <td class="px-3 py-2 text-xs">{s.isActive ? 'Sim' : 'Não'}</td>
                <td class="px-3 py-2 text-right">
                  {#if !s.isSystem}
                    <Button
                      size="sm"
                      variant="ghost"
                      onclick={() => handleDelete(s.key)}
                      disabled={deleting === s.key}
                    >
                      <Trash2 class="size-3" />
                    </Button>
                  {/if}
                </td>
              </tr>
            {/each}
          {:else}
            <tr><td colspan="6" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">Nenhuma seção</td></tr>
          {/if}
        </tbody>
      </table>
    </div>

    <div class="flex justify-end gap-2">
      <Button size="sm" variant="outline" onclick={() => (page = Math.max(1, page - 1))} disabled={page <= 1}>←</Button>
      <span class="text-xs text-gray-500 dark:text-neutral-500 self-center">{page} / {totalPages}</span>
      <Button size="sm" variant="outline" onclick={() => (page = page + 1)} disabled={page >= totalPages}>→</Button>
    </div>
  {/if}
</div>
