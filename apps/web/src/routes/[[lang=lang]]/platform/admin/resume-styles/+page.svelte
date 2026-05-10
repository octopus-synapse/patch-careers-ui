<script lang="ts">
  /**
   * Admin resume-styles — burra: lista estilos + delete.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    deleteV1AdminResumeStylesId,
    createGetV1ResumeStyles,
    getV1ResumeStylesQueryKey,
  } from 'api-client';
  import { Lock, Trash2 } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';

  const queryClient = useQueryClient();

  const listQuery = createGetV1ResumeStyles(
    { page: 1, limit: 50 },
    { query: { enabled: browser } },
  );

  const styles = $derived($listQuery.data?.items);

  let deleting = $state<string | null>(null);
  async function handleDelete(id: string) {
    deleting = id;
    try {
      await deleteV1AdminResumeStylesId(id);
      toastState.show('Estilo excluído', 'success');
      await queryClient.invalidateQueries({
        queryKey: getV1ResumeStylesQueryKey({ page: 1, limit: 50 }),
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      deleting = null;
    }
  }
</script>

<svelte:head>
  <title>Resume Styles</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
    Resume Styles
  </h1>

  {#if $listQuery.isLoading}
    <div class="flex items-center justify-center py-12"><Loader size={20} /></div>
  {:else}
    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">Nome</th>
            <th class="px-3 py-2">Layout</th>
            <th class="px-3 py-2">Descrição</th>
            <th class="px-3 py-2">Origem</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#if styles && styles.length}
            {#each styles as s}
              <tr class="border-t border-border">
                <td class="px-3 py-2">{s.name}</td>
                <td class="px-3 py-2 font-mono text-xs">{s.layoutKind}</td>
                <td class="px-3 py-2 text-xs max-w-md truncate">{s.description ?? '—'}</td>
                <td class="px-3 py-2 text-xs">
                  {#if s.isSystem}
                    <span class="inline-flex items-center gap-1 text-amber-600">
                      <Lock class="size-3" />
                      Sistema
                    </span>
                  {:else}
                    Custom
                  {/if}
                </td>
                <td class="px-3 py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onclick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                  >
                    <Trash2 class="size-3" />
                  </Button>
                </td>
              </tr>
            {/each}
          {:else}
            <tr><td colspan="5" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">Nenhum estilo</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>
