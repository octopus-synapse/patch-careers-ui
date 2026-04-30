<script lang="ts">
  /**
   * Admin sections — burra: lista section types + delete. Backend retorna
   * `void` no schema OpenAPI; cast local da resposta.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    adminSectionTypesDelete,
    createAdminSectionTypesList,
    getAdminSectionTypesListQueryKey,
  } from 'api-client';
  import { Trash2 } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { browser } from '$app/environment';

  type SectionType = {
    key: string;
    label?: string;
    isSystem?: boolean;
    isActive?: boolean;
    semantic?: string;
  };

  const queryClient = useQueryClient();

  let page = $state(1);
  let pageSize = $state(20);
  let search = $state('');

  const listQuery = createAdminSectionTypesList(
    () => ({ page, pageSize, search: search || undefined }),
    () => ({ query: { enabled: browser } }),
  );

  const items = $derived(
    (listQuery.data as unknown as { items?: SectionType[]; totalPages?: number } | undefined)
      ?.items ?? [],
  );
  const totalPages = $derived(
    (listQuery.data as unknown as { totalPages?: number } | undefined)?.totalPages ?? 1,
  );

  let deleting = $state<string | null>(null);
  async function handleDelete(key: string) {
    deleting = key;
    try {
      await adminSectionTypesDelete(key);
      toastState.show('Seção excluída', 'success');
      await queryClient.invalidateQueries({ queryKey: getAdminSectionTypesListQueryKey() });
    } catch {
      toastState.show('Falha ao excluir', 'danger');
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
    Section Types
  </h1>

  <input
    type="search"
    placeholder="Buscar..."
    bind:value={search}
    class="w-full max-w-sm rounded-md border border-border bg-background px-3 py-1.5 text-sm"
  />

  {#if listQuery.isLoading}
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
          {#each items as s}
            <tr class="border-t border-border">
              <td class="px-3 py-2 font-mono text-xs">{s.key}</td>
              <td class="px-3 py-2">{s.label ?? '—'}</td>
              <td class="px-3 py-2 text-xs">{s.semantic ?? '—'}</td>
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
          {:else}
            <tr><td colspan="6" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">Nenhuma seção</td></tr>
          {/each}
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
