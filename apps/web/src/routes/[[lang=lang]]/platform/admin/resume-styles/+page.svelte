<script lang="ts">
  /**
   * Admin resume-styles — burra: lista estilos + delete. Backend retorna
   * `void` no schema OpenAPI; cast local da resposta.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    adminResumeStylesDelete,
    createResumeStylesList,
    resumeStylesListQueryKey,
  } from 'api-client';
  import { Lock, Trash2 } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';

  type Style = {
    id: string;
    name?: string;
    slug?: string;
    description?: string;
    isPremium?: boolean;
    requiredRank?: number;
  };

  const queryClient = useQueryClient();

  const listQuery = createResumeStylesList(
    { page: '1', limit: '50' },
    { query: { enabled: browser } },
  );

  const styles = $derived(
    ($listQuery.data as unknown as { items?: Style[] } | undefined)?.items ?? [],
  );

  let deleting = $state<string | null>(null);
  async function handleDelete(id: string) {
    deleting = id;
    try {
      await adminResumeStylesDelete(id);
      toastState.show('Estilo excluído', 'success');
      await queryClient.invalidateQueries({
        queryKey: resumeStylesListQueryKey({ page: '1', limit: '50' }),
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
            <th class="px-3 py-2">Slug</th>
            <th class="px-3 py-2">Descrição</th>
            <th class="px-3 py-2">Plano</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#each styles as s}
            <tr class="border-t border-border">
              <td class="px-3 py-2">{s.name ?? '—'}</td>
              <td class="px-3 py-2 font-mono text-xs">{s.slug ?? '—'}</td>
              <td class="px-3 py-2 text-xs max-w-md truncate">{s.description ?? '—'}</td>
              <td class="px-3 py-2 text-xs">
                {#if s.isPremium}
                  <span class="inline-flex items-center gap-1 text-amber-600">
                    <Lock class="size-3" />
                    Premium
                  </span>
                {:else}
                  Free
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
          {:else}
            <tr><td colspan="5" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">Nenhum estilo</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
