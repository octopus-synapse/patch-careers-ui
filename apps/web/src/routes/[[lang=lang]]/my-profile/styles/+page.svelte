<script lang="ts">
  import {
    createResumesGetAllUserResumes,
    createResumeStylesApply,
    createResumeStylesList,
    getBaseUrl,
  } from 'api-client';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { CheckCircle2, Loader2, Lock } from 'lucide-svelte';
  import { Button, RankBadge, toastState } from 'ui';
  import { browser } from '$app/environment';
  import { useAuth } from '$lib/state/auth.svelte';

  const auth = useAuth();
  const currentUserId = $derived(String(auth.data?.user?.id ?? ''));
  const queryClient = useQueryClient();

  const listQuery = createResumeStylesList(
    () => ({ page: '1', limit: '20' }),
    () => ({ query: { enabled: browser, refetchOnWindowFocus: false } }),
  );

  /** First resume for apply action. */
  const myResumesQuery = createResumesGetAllUserResumes(
    () => ({ userId: currentUserId, page: 1, limit: 1 }),
    () => ({ query: { enabled: browser && !!currentUserId } }),
  );
  const primaryResumeId = $derived<string | null>(
    myResumesQuery.data &&
      typeof myResumesQuery.data === 'object' &&
      'data' in myResumesQuery.data &&
      Array.isArray((myResumesQuery.data as { data: unknown[] }).data) &&
      (myResumesQuery.data as { data: Array<{ id?: string }> }).data.length > 0
      ? ((myResumesQuery.data as { data: Array<{ id?: string }> }).data[0]?.id ?? null)
      : null,
  );

  const applyMutation = createResumeStylesApply(() => ({ mutation: {} }));

  let applyingStyleId = $state<string | null>(null);
  async function applyStyle(styleId: string): Promise<void> {
    if (!primaryResumeId) {
      toastState.show('Você precisa ter um currículo pra aplicar um estilo.', 'danger');
      return;
    }
    applyingStyleId = styleId;
    try {
      await applyMutation.mutateAsync({
        resumeId: primaryResumeId,
        data: { styleId },
      });
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

  /** Preview URL built by hand since the endpoint returns a PDF stream.
   *  Loading it into an <object> lets the browser handle the PDF natively
   *  and also benefits from the backend's MinIO cache transparently. */
  const baseUrl = $derived(browser ? getBaseUrl() : '');
  function previewUrl(id: string): string {
    return `${baseUrl}/v1/resume-styles/${id}/preview.pdf`;
  }

  const styles = $derived(listQuery.data?.items ?? []);
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

  {#if listQuery.isPending}
    <div class="flex justify-center py-12">
      <Loader2 class="animate-spin text-neutral-500" size={24} />
    </div>
  {:else if listQuery.isError || styles.length === 0}
    <div class="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
      Nenhum estilo disponível no momento.
    </div>
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
                <Loader2 size={14} class="animate-spin" />
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
