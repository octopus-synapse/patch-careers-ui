<script lang="ts">
  /**
   * Admin fit-questions — burra: lista + create + delete.
   * Stratification counters agrupam o catalog por família de dimensão
   * (Big Five / Schwartz / SDT). Create form usa o zod schema gerado
   * pelo SDK; o enum de 18 dimensões vem do backend via SDK regen.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    type PostV1AdminFitQuestionsMutationRequest,
    createPostV1AdminFitQuestions,
    deleteV1AdminFitQuestionsId,
    createGetV1AdminFitQuestions,
    getV1AdminFitQuestionsQueryKey,
    isApiError,
  } from 'api-client';
  import { postV1AdminFitQuestionsMutationRequestSchema } from 'api-client/zod';
  import { Plus, Trash2 } from 'lucide-svelte';
  import { locale } from '$lib/state/locale.svelte';
  const t = $derived(locale.t);
  import { Button, Input, Label, Loader, Modal, Textarea, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';
  import { createForm } from '$lib/state/create-form.svelte';

  const queryClient = useQueryClient();

  const listQuery = createGetV1AdminFitQuestions({
      query: { enabled: browser, refetchOnWindowFocus: false },
    });

  const questions = $derived($listQuery.data?.items);

  // 18 dimensions, derived from the SDK enum so the list stays in sync
  // with the backend after every regen. Order preserved from the schema.
  const DIMENSIONS = [
    'BIG_FIVE_OPENNESS',
    'BIG_FIVE_CONSCIENTIOUSNESS',
    'BIG_FIVE_EXTRAVERSION',
    'BIG_FIVE_AGREEABLENESS',
    'BIG_FIVE_NEUROTICISM',
    'SCHWARTZ_SELF_DIRECTION',
    'SCHWARTZ_STIMULATION',
    'SCHWARTZ_HEDONISM',
    'SCHWARTZ_ACHIEVEMENT',
    'SCHWARTZ_POWER',
    'SCHWARTZ_SECURITY',
    'SCHWARTZ_CONFORMITY',
    'SCHWARTZ_TRADITION',
    'SCHWARTZ_BENEVOLENCE',
    'SCHWARTZ_UNIVERSALISM',
    'SDT_AUTONOMY',
    'SDT_COMPETENCE',
    'SDT_RELATEDNESS',
  ] as const;

  // Counters mirror the active catalog (seeded 30 BF / 50 Schwartz / 20 SDT).
  // Inactive rows (fixtures / deprecated) are excluded so the totals match
  // the questions actually shown to users.
  const stratification = $derived.by(() => {
    const items = (questions ?? []).filter((q) => q.isActive);
    let bigFive = 0;
    let schwartz = 0;
    let sdt = 0;
    for (const q of items) {
      if (q.dimension.startsWith('BIG_FIVE_')) bigFive += 1;
      else if (q.dimension.startsWith('SCHWARTZ_')) schwartz += 1;
      else if (q.dimension.startsWith('SDT_')) sdt += 1;
    }
    return { bigFive, schwartz, sdt };
  });

  let createOpen = $state(false);

  const createMutation = createPostV1AdminFitQuestions({
    mutation: {
      onSuccess: async () => {
        toastState.show(t('actions.createdQuestion'), 'success');
        createOpen = false;
        form.reset();
        await queryClient.invalidateQueries({ queryKey: getV1AdminFitQuestionsQueryKey() });
      },
      onError: (err) => {
        if (isApiError(err)) {
          form.setFieldError('key', err.message);
        } else {
          handleApiError(err);
        }
      },
    },
  });

  const form = createForm<PostV1AdminFitQuestionsMutationRequest>({
    schema: postV1AdminFitQuestionsMutationRequestSchema,
    initial: {
      key: '',
      dimension: 'BIG_FIVE_OPENNESS',
      textEn: '',
      textPtBr: '',
      scaleType: 'likert5',
    },
    mutation: createMutation,
  });

  function handleSubmit() {
    form.submit();
  }

  function handleOpen() {
    form.reset();
    createOpen = true;
  }

  function handleClose() {
    createOpen = false;
  }

  let deleting = $state<string | null>(null);
  async function handleDelete(id: string) {
    deleting = id;
    try {
      await deleteV1AdminFitQuestionsId(id);
      toastState.show(t('actions.deletedQuestion'), 'success');
      await queryClient.invalidateQueries({ queryKey: getV1AdminFitQuestionsQueryKey() });
    } catch (err) {
      handleApiError(err);
    } finally {
      deleting = null;
    }
  }
</script>

<svelte:head>
  <title>Fit Questions</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
      {t('admin.fitQuestions.heading')}
    </h1>
    <Button size="sm" variant="solid" onclick={handleOpen}>
      <Plus class="size-3" />
      {t('admin.fitQuestions.newQuestion')}
    </Button>
  </div>

  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div class="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <div class="text-xs text-gray-500 dark:text-neutral-500">Big Five</div>
      <div class="mt-1 text-2xl font-semibold text-gray-800 dark:text-neutral-200">
        {stratification.bigFive}
      </div>
    </div>
    <div class="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <div class="text-xs text-gray-500 dark:text-neutral-500">Schwartz</div>
      <div class="mt-1 text-2xl font-semibold text-gray-800 dark:text-neutral-200">
        {stratification.schwartz}
      </div>
    </div>
    <div class="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <div class="text-xs text-gray-500 dark:text-neutral-500">SDT</div>
      <div class="mt-1 text-2xl font-semibold text-gray-800 dark:text-neutral-200">
        {stratification.sdt}
      </div>
    </div>
  </div>

  {#if $listQuery.isLoading}
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
          {#if questions && questions.length > 0}
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
            {/each}
          {:else}
            <tr><td colspan="6" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">Nenhuma pergunta</td></tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<Modal open={createOpen} onClose={handleClose}>
  {#snippet title()}Nova questão{/snippet}
  <form
    onsubmit={(e) => {
      e.preventDefault();
      handleSubmit();
    }}
    class="space-y-4"
  >
    <div class="space-y-3">
      <div>
        <Label for="q-key">Key</Label>
        <Input id="q-key" type="text" bind:value={form.values.key} class="mt-1" />
        {#if form.errors.key}
          <span class="mt-1 block text-xs text-red-500">{form.errors.key}</span>
        {/if}
      </div>
      <div>
        <Label for="q-dim">{t('admin.fitQuestions.fieldDimension')}</Label>
        <select
          id="q-dim"
          bind:value={form.values.dimension}
          class="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
        >
          {#each DIMENSIONS as dim}
            <option value={dim}>{dim}</option>
          {/each}
        </select>
        {#if form.errors.dimension}
          <span class="mt-1 block text-xs text-red-500">{form.errors.dimension}</span>
        {/if}
      </div>
      <div>
        <Label for="q-text-en">{t('admin.fitQuestions.fieldTextEn')}</Label>
        <Textarea id="q-text-en" bind:value={form.values.textEn} rows={2} class="mt-1" />
        {#if form.errors.textEn}
          <span class="mt-1 block text-xs text-red-500">{form.errors.textEn}</span>
        {/if}
      </div>
      <div>
        <Label for="q-text-pt">{t('admin.fitQuestions.fieldTextPtBr')}</Label>
        <Textarea id="q-text-pt" bind:value={form.values.textPtBr} rows={2} class="mt-1" />
        {#if form.errors.textPtBr}
          <span class="mt-1 block text-xs text-red-500">{form.errors.textPtBr}</span>
        {/if}
      </div>
      <div>
        <Label for="q-scale">Escala</Label>
        <select
          id="q-scale"
          bind:value={form.values.scaleType}
          class="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
        >
          <option value="likert5">likert5</option>
          <option value="binary">binary</option>
        </select>
      </div>
    </div>
    <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button variant="outline" size="sm" onclick={handleClose} disabled={form.isSubmitting} type="button">Cancelar</Button>
      <Button variant="solid" size="sm" disabled={form.isSubmitting} type="submit">Criar</Button>
    </div>
  </form>
</Modal>
