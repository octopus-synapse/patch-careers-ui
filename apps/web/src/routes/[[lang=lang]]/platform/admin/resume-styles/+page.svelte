<script lang="ts">
  /**
   * Admin resume-styles — burra: lista estilos + create + delete.
   * System styles (isSystem=true) só expõem link de preview (PDF).
   * Custom styles ganham botão de delete. Create form usa o zod schema
   * gerado pelo SDK; styleConfig/sectionStyles aceitam JSON e fazem
   * parse no submit antes de enviar.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    type PostV1AdminResumeStylesMutationRequest,
    createPostV1AdminResumeStyles,
    deleteV1AdminResumeStylesId,
    createGetV1ResumeStyles,
    getV1ResumeStylesQueryKey,
    isApiError,
  } from 'api-client';
  import { postV1AdminResumeStylesMutationRequestSchema } from 'api-client/zod';
  import { Lock, Plus, Trash2 } from 'lucide-svelte';
  import { locale } from '$lib/state/locale.svelte';
  const t = $derived(locale.t);
  import { Button, Input, Label, Loader, Modal, Textarea, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';
  import { createForm } from '$lib/state/create-form.svelte';

  const queryClient = useQueryClient();

  const listQuery = createGetV1ResumeStyles(
    { page: 1, limit: 50 },
    { query: { enabled: () => browser} },
  );

  const styles = $derived($listQuery.data?.items);

  // Local mirror of form values that aren't 1:1 in the SDK schema —
  // styleConfig/sectionStyles ship as JSON objects but the admin types
  // raw text and we parse on submit. createForm still owns the
  // canonical state for the rest of the fields.
  let styleConfigText = $state('{}');
  let sectionStylesText = $state('{}');

  let createOpen = $state(false);

  const createMutation = createPostV1AdminResumeStyles({
    mutation: {
      onSuccess: async () => {
        toastState.show(t('actions.createdStyle'), 'success');
        createOpen = false;
        form.reset();
        styleConfigText = '{}';
        sectionStylesText = '{}';
        await queryClient.invalidateQueries({
          queryKey: getV1ResumeStylesQueryKey({ page: 1, limit: 50 }),
        });
      },
      onError: (err) => {
        if (isApiError(err)) {
          form.setFieldError('name', err.message);
        } else {
          handleApiError(err);
        }
      },
    },
  });

  const form = createForm<PostV1AdminResumeStylesMutationRequest>({
    schema: postV1AdminResumeStylesMutationRequestSchema,
    initial: {
      name: '',
      description: '',
      typstTemplate: '',
      layoutKind: 'SINGLE_COLUMN',
      styleConfig: {},
      sectionStyles: {},
    },
    transform: (v) => ({
      ...v,
      description: v.description?.trim() || undefined,
      styleConfig: safeJson(styleConfigText),
      sectionStyles: safeJson(sectionStylesText),
    }),
  mutation: createMutation,
  });

  function safeJson(raw: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(raw || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  function handleSubmit() {
    form.submit();
  }

  function handleOpen() {
    form.reset();
    styleConfigText = '{}';
    sectionStylesText = '{}';
    createOpen = true;
  }

  function handleClose() {
    createOpen = false;
  }

  let deleting = $state<string | null>(null);
  async function handleDelete(id: string) {
    deleting = id;
    try {
      await deleteV1AdminResumeStylesId(id);
      toastState.show(t('actions.deletedStyle'), 'success');
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
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
      {t('admin.resumeStyles.heading')}
    </h1>
    <Button size="sm" variant="solid" onclick={handleOpen}>
      <Plus class="size-3" />
      {t('admin.resumeStyles.newStyle')}
    </Button>
  </div>

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
                  {#if s.isSystem}
                    <a
                      href="/api/v1/resume-styles/{s.id}/preview/pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >Preview</a>
                  {:else}
                    <Button
                      size="sm"
                      variant="ghost"
                      onclick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                    >
                      <Trash2 class="size-3" />
                    </Button>
                  {/if}
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

<Modal open={createOpen} onClose={handleClose}>
  {#snippet title()}Novo estilo{/snippet}
  <form
    onsubmit={(e) => {
      e.preventDefault();
      handleSubmit();
    }}
    class="space-y-4"
  >
    <div class="space-y-3">
      <div>
        <Label for="style-name">Nome</Label>
        <Input id="style-name" type="text" bind:value={form.values.name} class="mt-1" />
        {#if form.errors.name}
          <span class="mt-1 block text-xs text-red-500">{form.errors.name}</span>
        {/if}
      </div>
      <div>
        <Label for="style-description">{t('admin.resumeStyles.fieldDescription')}</Label>
        <Input
          id="style-description"
          type="text"
          value={form.values.description ?? ''}
          oninput={(e) => (form.values.description = (e.currentTarget as HTMLInputElement).value)}
          class="mt-1"
        />
      </div>
      <div>
        <Label for="style-layout">Layout</Label>
        <select
          id="style-layout"
          bind:value={form.values.layoutKind}
          class="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
        >
          <option value="SINGLE_COLUMN">SINGLE_COLUMN</option>
          <option value="DOUBLE_COLUMN">DOUBLE_COLUMN</option>
        </select>
        {#if form.errors.layoutKind}
          <span class="mt-1 block text-xs text-red-500">{form.errors.layoutKind}</span>
        {/if}
      </div>
      <div>
        <Label for="style-typst">{t('admin.resumeStyles.fieldTypstTemplate')}</Label>
        <Textarea
          id="style-typst"
          bind:value={form.values.typstTemplate}
          rows={4}
          class="mt-1 font-mono text-xs"
        />
        {#if form.errors.typstTemplate}
          <span class="mt-1 block text-xs text-red-500">{form.errors.typstTemplate}</span>
        {/if}
      </div>
      <div>
        <Label for="style-config">{t('admin.resumeStyles.fieldStyleConfig')}</Label>
        <Textarea
          id="style-config"
          bind:value={styleConfigText}
          rows={3}
          class="mt-1 font-mono text-xs"
        />
      </div>
      <div>
        <Label for="style-section">{t('admin.resumeStyles.fieldSectionStyles')}</Label>
        <Textarea
          id="style-section"
          bind:value={sectionStylesText}
          rows={3}
          class="mt-1 font-mono text-xs"
        />
      </div>
    </div>
    <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button variant="outline" size="sm" onclick={handleClose} disabled={form.isSubmitting} type="button">Cancelar</Button>
      <Button variant="solid" size="sm" disabled={form.isSubmitting} type="submit">Criar</Button>
    </div>
  </form>
</Modal>
