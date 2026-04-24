<script lang="ts">
  import {
    adminFitQuestionsCreateOne,
    adminFitQuestionsDeleteOne,
    adminFitQuestionsUpdateOne,
    createAdminFitQuestionsListAll,
    getAdminFitQuestionsListAllQueryKey,
  } from 'api-client';
  import type { FitQuestionResponseDto } from 'api-client';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { Loader2, Pencil, Plus, Trash2 } from 'lucide-svelte';
  import { Button, Input, Label, Modal, Textarea, toastState } from 'ui';
  import { browser } from '$app/environment';

  const queryClient = useQueryClient();

  const listQuery = createAdminFitQuestionsListAll(() => ({
    query: { enabled: browser, refetchOnWindowFocus: false },
  }));

  const questions = $derived<FitQuestionResponseDto[]>(
    (listQuery.data?.items ?? []) as FitQuestionResponseDto[],
  );

  /** Stratification — stable color per block for the mini bar chart. */
  const DIM_GROUPS = {
    bigFive: ['BIG_FIVE_OPENNESS', 'BIG_FIVE_CONSCIENTIOUSNESS', 'BIG_FIVE_EXTRAVERSION', 'BIG_FIVE_AGREEABLENESS', 'BIG_FIVE_NEUROTICISM'],
    schwartz: [
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
    ],
    sdt: ['SDT_AUTONOMY', 'SDT_COMPETENCE', 'SDT_RELATEDNESS'],
  } as const;

  const countsByBlock = $derived<{ bigFive: number; schwartz: number; sdt: number }>({
    bigFive: questions.filter((q) => DIM_GROUPS.bigFive.includes(q.dimension as never)).length,
    schwartz: questions.filter((q) => DIM_GROUPS.schwartz.includes(q.dimension as never)).length,
    sdt: questions.filter((q) => DIM_GROUPS.sdt.includes(q.dimension as never)).length,
  });

  type FormState = {
    id: string | null;
    key: string;
    dimension: string;
    textEn: string;
    textPtBr: string;
    scaleType: 'likert5' | 'binary';
    weight: number;
    isActive: boolean;
    reverseScored: boolean;
  };

  function emptyForm(): FormState {
    return {
      id: null,
      key: '',
      dimension: 'BIG_FIVE_OPENNESS',
      textEn: '',
      textPtBr: '',
      scaleType: 'likert5',
      weight: 1,
      isActive: true,
      reverseScored: false,
    };
  }

  let modalOpen = $state(false);
  let form = $state<FormState>(emptyForm());
  let saving = $state(false);
  let formError = $state<string | null>(null);

  function openCreate(): void {
    form = emptyForm();
    formError = null;
    modalOpen = true;
  }

  function openEdit(q: FitQuestionResponseDto): void {
    form = {
      id: q.id,
      key: q.key,
      dimension: q.dimension as string,
      textEn: q.textEn,
      textPtBr: q.textPtBr,
      scaleType: (q.scaleType as 'likert5' | 'binary') ?? 'likert5',
      weight: q.weight,
      isActive: q.isActive,
      reverseScored: q.reverseScored ?? false,
    };
    formError = null;
    modalOpen = true;
  }

  async function save(): Promise<void> {
    saving = true;
    formError = null;
    try {
      if (form.id) {
        await adminFitQuestionsUpdateOne(form.id, {
          dimension: form.dimension as FitQuestionResponseDto['dimension'],
          textEn: form.textEn,
          textPtBr: form.textPtBr,
          scaleType: form.scaleType,
          weight: form.weight,
          isActive: form.isActive,
          reverseScored: form.reverseScored,
        });
        toastState.show('Questão atualizada.', 'success');
      } else {
        await adminFitQuestionsCreateOne({
          key: form.key,
          dimension: form.dimension as FitQuestionResponseDto['dimension'],
          textEn: form.textEn,
          textPtBr: form.textPtBr,
          scaleType: form.scaleType,
          weight: form.weight,
          isActive: form.isActive,
          reverseScored: form.reverseScored,
        });
        toastState.show('Questão criada.', 'success');
      }
      modalOpen = false;
      await queryClient.invalidateQueries({ queryKey: getAdminFitQuestionsListAllQueryKey() });
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Não foi possível salvar.';
    } finally {
      saving = false;
    }
  }

  async function remove(q: FitQuestionResponseDto): Promise<void> {
    if (!confirm(`Apagar a questão "${q.key}"?`)) return;
    try {
      await adminFitQuestionsDeleteOne(q.id);
      toastState.show('Questão apagada.', 'success');
      await queryClient.invalidateQueries({ queryKey: getAdminFitQuestionsListAllQueryKey() });
    } catch (err) {
      toastState.show(err instanceof Error ? err.message : 'Não foi possível apagar.', 'danger');
    }
  }

  const allDimensions = [...DIM_GROUPS.bigFive, ...DIM_GROUPS.schwartz, ...DIM_GROUPS.sdt] as const;
</script>

<section class="mx-auto max-w-5xl space-y-6 p-6">
  <header class="flex items-start justify-between">
    <div>
      <h1 class="text-2xl font-semibold">Fit Questions</h1>
      <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Pool de questões psicometric stratificadas por Big Five / Schwartz / SDT.
        O sampler pega 25 por usuário; mudanças aqui afetam próximos questionários.
      </p>
    </div>
    <Button variant="solid" size="sm" onclick={openCreate}>
      <Plus size={14} />
      Nova questão
    </Button>
  </header>

  <div class="grid grid-cols-3 gap-4">
    <div class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div class="text-xs uppercase text-neutral-500">Big Five</div>
      <div class="mt-1 text-2xl font-bold">{countsByBlock.bigFive}</div>
    </div>
    <div class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div class="text-xs uppercase text-neutral-500">Schwartz</div>
      <div class="mt-1 text-2xl font-bold">{countsByBlock.schwartz}</div>
    </div>
    <div class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div class="text-xs uppercase text-neutral-500">SDT</div>
      <div class="mt-1 text-2xl font-bold">{countsByBlock.sdt}</div>
    </div>
  </div>

  {#if listQuery.isPending}
    <div class="flex justify-center py-12"><Loader2 class="animate-spin" /></div>
  {:else}
    <div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table class="w-full text-sm">
        <thead class="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th class="px-4 py-2 text-left">Key</th>
            <th class="px-4 py-2 text-left">Dimensão</th>
            <th class="px-4 py-2 text-left">Enunciado (pt-BR)</th>
            <th class="px-4 py-2 text-left">Ativa</th>
            <th class="px-4 py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each questions as q (q.id)}
            <tr class="border-t border-neutral-100 dark:border-neutral-800">
              <td class="px-4 py-3 font-mono text-xs">{q.key}</td>
              <td class="px-4 py-3 text-xs">{q.dimension}</td>
              <td class="px-4 py-3 line-clamp-1">{q.textPtBr}</td>
              <td class="px-4 py-3">{q.isActive ? '✓' : '—'}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onclick={() => openEdit(q)}>
                    <Pencil size={12} />
                  </Button>
                  <Button variant="ghost" intent="danger" size="sm" onclick={() => remove(q)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

{#snippet modalTitle()}
  <span>{form.id ? 'Editar questão' : 'Nova questão'}</span>
{/snippet}

{#if modalOpen}
  <Modal open={modalOpen} onClose={() => (modalOpen = false)} title={modalTitle}>
    <div class="space-y-3 p-4 text-sm">
      <div>
        <Label for="q-key">Key</Label>
        <Input id="q-key" bind:value={form.key} disabled={!!form.id} />
      </div>
      <div>
        <Label for="q-dim">Dimensão</Label>
        <select
          id="q-dim"
          bind:value={form.dimension}
          class="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs dark:border-neutral-700 dark:bg-neutral-800"
        >
          {#each allDimensions as dim (dim)}
            <option value={dim}>{dim}</option>
          {/each}
        </select>
      </div>
      <div>
        <Label for="q-en">Texto (EN)</Label>
        <Textarea id="q-en" bind:value={form.textEn} rows={2} />
      </div>
      <div>
        <Label for="q-pt">Texto (pt-BR)</Label>
        <Textarea id="q-pt" bind:value={form.textPtBr} rows={2} />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <Label for="q-scale">Escala</Label>
          <select id="q-scale" bind:value={form.scaleType} class="w-full rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
            <option value="likert5">likert5</option>
            <option value="binary">binary</option>
          </select>
        </div>
        <div>
          <Label for="q-weight">Peso</Label>
          <input
            id="q-weight"
            type="number"
            min="0.1"
            step="0.1"
            bind:value={form.weight}
            class="w-full rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
      </div>
      <label class="flex items-center gap-2 text-xs">
        <input type="checkbox" bind:checked={form.isActive} /> Ativa
      </label>
      <label class="flex items-center gap-2 text-xs">
        <input type="checkbox" bind:checked={form.reverseScored} /> Pontuação invertida
      </label>
      {#if formError}
        <div class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {formError}
        </div>
      {/if}
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={() => (modalOpen = false)}>Cancelar</Button>
        <Button variant="solid" size="sm" onclick={save} disabled={saving}>
          {#if saving}<Loader2 size={14} class="animate-spin" />{/if}
          Salvar
        </Button>
      </div>
    </div>
  </Modal>
{/if}
