<script lang="ts">
  /**
   * /my-profile/styles — burra: catálogo de estilos do backend; aplica no
   * primeiro currículo. Backend retorna `void` no schema OpenAPI; cast local.
   */
  import {
    createResumesList,
    createResumeStylesList,
    getBaseUrl,
    resumeStylesStyle,
  } from 'api-client';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { CheckCircle2, Lock } from 'lucide-svelte';
  import { Button, Card, Loader, RankBadge, toastState } from 'ui';
  import { browser } from '$app/environment';

  type Style = {
    id: string;
    name?: string;
    description?: string;
    isSystem?: boolean;
    styleScore?: number;
  };
  type ResumeRow = { id?: string };

  const queryClient = useQueryClient();

  const listQuery = createResumeStylesList(
    { page: '1', limit: '20' },
    { query: { enabled: browser, refetchOnWindowFocus: false } },
  );

  const myResumesQuery = createResumesList(
    { page: '1', limit: '1' },
    { query: { enabled: browser } },
  );
  const primaryResumeId = $derived<string | null>(
    (($myResumesQuery.data as unknown as { items?: ResumeRow[] } | undefined)?.items?.[0]?.id ??
      null) as string | null,
  );

  let applyingStyleId = $state<string | null>(null);
  async function applyStyle(styleId: string): Promise<void> {
    if (!primaryResumeId) {
      toastState.show('Você precisa ter um currículo pra aplicar um estilo.', 'danger');
      return;
    }
    applyingStyleId = styleId;
    try {
      await resumeStylesStyle(primaryResumeId, { styleId });
      toastState.show('Estilo aplicado ao seu currículo.', 'success');
      await queryClient.invalidateQueries({ queryKey: ['resume'] });
    } catch (err) {
      toastState.show(
        err instanceof Error ? err.message : 'Não foi possível aplicar o estilo.',
        'danger',
      );
    } finally {
      applyingStyleId = null;
    }
  }

  const baseUrl = $derived(browser ? getBaseUrl() : '');
  function previewUrl(id: string): string {
    return `${baseUrl}/v1/resume-styles/${id}/preview.pdf`;
  }

  const styles = $derived(
    (($listQuery.data as unknown as { items?: Style[] } | undefined)?.items ?? []) as Style[],
  );
</script>

<section class="mx-auto max-w-5xl space-y-6 p-6">
  <header>
    <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
      Estilos de currículo
    </h1>
    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
      Todos os estilos são ATS-safe por design. Aplique um no seu
      currículo e os scores de Style + Quality ficam disponíveis.
    </p>
  </header>

  {#if $listQuery.isPending}
    <div class="flex justify-center py-12">
      <Loader size={24} />
    </div>
  {:else if $listQuery.isError || styles.length === 0}
    <Card class="sm:p-6 text-sm text-neutral-600 dark:text-neutral-400">
      Nenhum estilo disponível no momento.
    </Card>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each styles as style (style.id)}
        <article class="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="relative aspect-[3/4] overflow-hidden border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
            <object
              data={previewUrl(style.id)}
              type="application/pdf"
              class="h-full w-full"
              aria-label="Preview de {style.name}"
            >
              <div class="flex h-full items-center justify-center p-4 text-xs text-neutral-500">
                Preview indisponível
              </div>
            </object>
            <div class="absolute left-2 top-2">
              <RankBadge score={style.styleScore} size="sm" showScore />
            </div>
            {#if style.isSystem}
              <div class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
                <Lock size={10} />
                Sistema
              </div>
            {/if}
          </div>
          <div class="flex flex-1 flex-col gap-2 p-4">
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{style.name}</h3>
              {#if style.description}
                <p class="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {style.description}
                </p>
              {/if}
            </div>
            <Button
              variant="solid"
              size="sm"
              onclick={() => applyStyle(style.id)}
              disabled={applyingStyleId === style.id || !primaryResumeId}
            >
              {#if applyingStyleId === style.id}
                <Loader size={14} />
              {:else}
                <CheckCircle2 size={14} />
              {/if}
              Aplicar
            </Button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
