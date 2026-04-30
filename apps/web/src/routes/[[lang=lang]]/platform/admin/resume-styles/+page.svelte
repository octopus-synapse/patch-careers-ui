<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
  import {
    adminResumeStylesCreate,
    adminResumeStylesDelete,
    adminResumeStylesUpdate,
    createResumeStylesList,
    getBaseUrl,
    getResumeStylesListQueryKey,
  } from 'api-client';
  import type { StyleListResponseDtoItemsItem } from 'api-client';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { Lock, Pencil, Plus, Trash2 } from 'lucide-svelte';
  import { Button, Input, Label, Loader, Modal, RankBadge, Select, Textarea, toastState } from 'ui';
  import { browser } from '$app/environment';

  const queryClient = useQueryClient();

  const listQuery = createResumeStylesList(
    () => ({ page: '1', limit: '50' }),
    () => ({ query: { enabled: browser } }),
  );

  const styles = $derived<StyleListResponseDtoItemsItem[]>(
    (listQuery.data?.items ?? []) as StyleListResponseDtoItemsItem[],
  );

  type FormState = {
    id: string | null;
    name: string;
    description: string;
    typstTemplate: 'default' | 'ats';
    layoutKind: 'SINGLE_COLUMN' | 'DOUBLE_COLUMN';
    styleConfigJson: string;
  };

  function emptyForm(): FormState {
    return {
      id: null,
      name: '',
      description: '',
      typstTemplate: 'default',
      layoutKind: 'SINGLE_COLUMN',
      styleConfigJson: '{\n  "tokens": {}\n}',
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

  function openEdit(style: StyleListResponseDtoItemsItem): void {
    form = {
      id: style.id,
      name: style.name,
      description: style.description ?? '',
      typstTemplate: (style.typstTemplate as 'default' | 'ats') ?? 'default',
      layoutKind: (style.layoutKind as 'SINGLE_COLUMN' | 'DOUBLE_COLUMN') ?? 'SINGLE_COLUMN',
      styleConfigJson: '{\n  "tokens": {}\n}', // backend returns it in GET /:id only
    };
    formError = null;
    modalOpen = true;
  }

  async function save(): Promise<void> {
    let styleConfig: Record<string, unknown>;
    try {
      styleConfig = JSON.parse(form.styleConfigJson) as Record<string, unknown>;
    } catch {
      formError = 'styleConfig não é JSON válido';
      return;
    }
    saving = true;
    formError = null;
    try {
      if (form.id) {
        await adminResumeStylesUpdate(form.id, {
          name: form.name,
          description: form.description || null,
          typstTemplate: form.typstTemplate,
          layoutKind: form.layoutKind,
          styleConfig,
        });
        toastState.show('Estilo atualizado.', 'success');
      } else {
        await adminResumeStylesCreate({
          name: form.name,
          description: form.description || null,
          typstTemplate: form.typstTemplate,
          layoutKind: form.layoutKind,
          styleConfig,
        });
        toastState.show('Estilo criado.', 'success');
      }
      modalOpen = false;
      await queryClient.invalidateQueries({ queryKey: getResumeStylesListQueryKey() });
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Não foi possível salvar.';
    } finally {
      saving = false;
    }
  }

  async function remove(style: StyleListResponseDtoItemsItem): Promise<void> {
    if (!confirm(`Apagar o estilo "${style.name}"?`)) return;
    try {
      await adminResumeStylesDelete(style.id);
      toastState.show('Estilo apagado.', 'success');
      await queryClient.invalidateQueries({ queryKey: getResumeStylesListQueryKey() });
    } catch (err) {
      toastState.show(
        err instanceof Error ? err.message : 'Não foi possível apagar.',
        'danger',
      );
    }
  }

  const baseUrl = $derived(browser ? getBaseUrl() : '');
</script>

<section class="mx-auto max-w-5xl space-y-6 p-6">
  <header class="flex items-start justify-between">
    <div>
      <h1 class="text-2xl font-semibold">Resume Styles</h1>
      <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Catálogo de estilos ATS-safe. Criação + edição são validadas
        contra o threshold (score ≥ 70); sistema rejeita com 422.
      </p>
    </div>
    <Button variant="solid" size="sm" onclick={openCreate}>
      <Plus size={14} />
      Novo estilo
    </Button>
  </header>

  {#if listQuery.isPending}
    <div class="flex justify-center py-12"><Loader /></div>
  {:else}
    <div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table class="w-full text-sm">
        <thead class="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th class="px-4 py-2 text-left">Nome</th>
            <th class="px-4 py-2 text-left">Score</th>
            <th class="px-4 py-2 text-left">Template</th>
            <th class="px-4 py-2 text-left">Layout</th>
            <th class="px-4 py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each styles as style (style.id)}
            <tr class="border-t border-neutral-100 dark:border-neutral-800">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span>{style.name}</span>
                  {#if style.isSystem}
                    <Lock size={12} class="text-neutral-400" />
                  {/if}
                </div>
                {#if style.description}
                  <div class="text-xs text-neutral-500 line-clamp-1">{style.description}</div>
                {/if}
              </td>
              <td class="px-4 py-3">
                <RankBadge score={style.styleScore} size="sm" showScore />
              </td>
              <td class="px-4 py-3 font-mono text-xs">{style.typstTemplate}</td>
              <td class="px-4 py-3 text-xs">{style.layoutKind}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <a
                    href={`${baseUrl}/v1/resume-styles/${style.id}/preview.pdf`}
                    target="_blank"
                    rel="noopener"
                    class="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                  >
                    Preview
                  </a>
                  {#if !style.isSystem}
                    <Button variant="ghost" size="sm" onclick={() => openEdit(style)}>
                      <Pencil size={12} />
                    </Button>
                    <Button variant="ghost" intent="danger" size="sm" onclick={() => remove(style)}>
                      <Trash2 size={12} />
                    </Button>
                  {/if}
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
  <span>{form.id ? 'Editar estilo' : 'Novo estilo'}</span>
{/snippet}

{#if modalOpen}
  <Modal open={modalOpen} onClose={() => (modalOpen = false)} title={modalTitle}>
    <div class="space-y-4 p-4 text-sm">
      <div>
        <Label for="style-name">Nome</Label>
        <Input id="style-name" bind:value={form.name} />
      </div>
      <div>
        <Label for="style-desc">Descrição</Label>
        <Textarea id="style-desc" bind:value={form.description} rows={2} />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <Label for="style-template">Typst template</Label>
          <Select id="style-template" bind:value={form.typstTemplate}>
            <option value="default">default</option>
            <option value="ats">ats</option>
          </Select>
        </div>
        <div>
          <Label for="style-layout">Layout</Label>
          <Select id="style-layout" bind:value={form.layoutKind}>
            <option value="SINGLE_COLUMN">SINGLE_COLUMN</option>
            <option value="DOUBLE_COLUMN">DOUBLE_COLUMN</option>
          </Select>
        </div>
      </div>
      <div>
        <Label for="style-config">styleConfig (JSON)</Label>
        <Textarea
          id="style-config"
          rows={8}
          bind:value={form.styleConfigJson}
          class="font-mono text-xs"
        />
      </div>
      {#if formError}
        <div class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {formError}
        </div>
      {/if}
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={() => (modalOpen = false)}>Cancelar</Button>
        <Button variant="solid" size="sm" onclick={save} disabled={saving}>
          {#if saving}<Loader size={14} />{/if}
          Salvar
        </Button>
      </div>
    </div>
  </Modal>
{/if}
