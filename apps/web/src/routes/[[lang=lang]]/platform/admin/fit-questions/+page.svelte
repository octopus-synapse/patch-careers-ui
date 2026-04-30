<script lang="ts">
  /**
   * Admin fit-questions — burra: lista + delete. Backend retorna `void`
   * no schema OpenAPI; cast local da resposta.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    adminFitQuestionsDelete,
    createAdminFitQuestionsList,
    getAdminFitQuestionsListQueryKey,
  } from 'api-client';
  import { Trash2 } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { browser } from '$app/environment';

  type Question = {
    id: string;
    key: string;
    dimension: string;
    textEn: string;
    textPtBr: string;
    scaleType: string;
    weight?: number;
    isActive?: boolean;
    reverseScored?: boolean;
  };

  const queryClient = useQueryClient();

  const listQuery = createAdminFitQuestionsList(() => ({
    query: { enabled: browser, refetchOnWindowFocus: false },
  }));

  const questions = $derived(
    (listQuery.data as unknown as { items?: Question[] } | undefined)?.items ?? [],
  );

  let deleting = $state<string | null>(null);
  async function handleDelete(id: string) {
    deleting = id;
    try {
      await adminFitQuestionsDelete(id);
      toastState.show('Pergunta excluída', 'success');
      await queryClient.invalidateQueries({ queryKey: getAdminFitQuestionsListQueryKey() });
    } catch {
      toastState.show('Falha ao excluir', 'danger');
    } finally {
      deleting = null;
    }
  }
</script>

<svelte:head>
  <title>Fit Questions</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
    Fit Questions
  </h1>

  {#if listQuery.isLoading}
    <div class="flex items-center justify-center py-12"><Loader size={20} /></div>
  {:else}
    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">Key</th>
            <th class="px-3 py-2">Dimensão</th>
            <th class="px-3 py-2">Texto (PT-BR)</th>
            <th class="px-3 py-2">Escala</th>
            <th class="px-3 py-2">Ativo</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#each questions as q}
            <tr class="border-t border-border">
              <td class="px-3 py-2 font-mono text-xs">{q.key}</td>
              <td class="px-3 py-2 text-xs">{q.dimension}</td>
              <td class="px-3 py-2 text-xs max-w-md truncate">{q.textPtBr}</td>
              <td class="px-3 py-2 text-xs">{q.scaleType}</td>
              <td class="px-3 py-2 text-xs">{q.isActive ? 'Sim' : 'Não'}</td>
              <td class="px-3 py-2 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => handleDelete(q.id)}
                  disabled={deleting === q.id}
                >
                  <Trash2 class="size-3" />
                </Button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="6" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">Nenhuma pergunta</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
