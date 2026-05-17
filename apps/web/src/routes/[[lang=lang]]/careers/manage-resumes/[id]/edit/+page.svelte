<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1ResumesResumeId,
  createPatchV1ResumesResumeId,
  getV1ResumesResumeIdQueryKey,
  type PatchV1ResumesResumeIdMutationRequest,
} from 'api-client';
import { ArrowLeft, Save } from 'lucide-svelte';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { Button, Input, Label, LinkButton, Loader, Textarea, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import ResumeQualityCard from '$lib/components/scoring/resume-quality-card.svelte';
import { locale } from '$lib/state/locale.svelte';
import { useFormDraft } from '$lib/state/use-form-draft.svelte';

const t = $derived(locale.t);
const resumeId = $derived($page.params.id);
const queryClient = useQueryClient();

type ResumeForm = Required<Pick<PatchV1ResumesResumeIdMutationRequest,
  'title' | 'fullName' | 'jobTitle' | 'summary' | 'location' | 'phone' | 'linkedin' | 'github' | 'website'
>>;

const draft = useFormDraft<ResumeForm>(() => `cv-${resumeId}`, {
  title: '',
  fullName: '',
  jobTitle: '',
  summary: '',
  location: '',
  phone: '',
  linkedin: '',
  github: '',
  website: '',
});

const resumeQuery = createGetV1ResumesResumeId(() => resumeId, { query: { enabled: () => browser} });

// Auto-save banner state — relative 'há Ns' is updated by timeTicker elsewhere.
let lastSavedAt = $state<number | null>(null);
let lastSaveError = $state(false);
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let dirtyForAutoSave = $state(false);
let hydrated = $state(false);

const updateMutation = createPatchV1ResumesResumeId({
  mutation: {
    onSuccess: () => {
      lastSavedAt = Date.now();
      lastSaveError = false;
      dirtyForAutoSave = false;
      queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdQueryKey(resumeId) });
    },
    onError: (err) => {
      lastSaveError = true;
      handleApiError(err);
    },
  },
});

// Hydrate the form once the resume payload arrives.
$effect(() => {
  const r = $resumeQuery.data;
  if (!r || hydrated) return;
  draft.state = {
    title: r.title ?? '',
    fullName: r.fullName ?? '',
    jobTitle: '',
    summary: r.summary ?? '',
    location: r.location ?? '',
    phone: r.phone ?? '',
    linkedin: '',
    github: '',
    website: '',
  };
  hydrated = true;
});

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  dirtyForAutoSave = true;
  autoSaveTimer = setTimeout(() => {
    if (!resumeId) return;
    $updateMutation.mutate({ resumeId, data: { ...draft.state } });
  }, 1200);
}

function relativeSavedAt(): string {
  if (lastSaveError) return 'Falha ao salvar';
  if ($updateMutation.isPending && dirtyForAutoSave) return 'Salvando…';
  if (!lastSavedAt) return 'Salvamento automático ativo';
  const diffSec = Math.floor((Date.now() - lastSavedAt) / 1000);
  if (diffSec < 5) return 'Salvo agora';
  if (diffSec < 60) return `Salvo há ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  return `Salvo há ${diffMin}min`;
}

$effect(() => {
  // Trigger auto-save on any draft change (the state dependency makes this reactive).
  void draft.state;
  if (hydrated && browser) scheduleAutoSave();
});

function save() {
  if (!resumeId) return;
  $updateMutation.mutate(
    { resumeId, data: { ...draft.state } },
    {
      onSuccess: () => {
        draft.clear();
        toastState.show(t('common.saved'), 'success');
        goto('/careers/manage-resumes');
      },
    },
  );
}
</script>

<svelte:head>
  <title>Editar currículo · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-20 pb-12">
  <header class="mb-6 flex items-center justify-between gap-3">
    <a
      href="/careers/manage-resumes"
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200"
    >
      <ArrowLeft size={16} />
      Voltar
    </a>
    {#if !$resumeQuery.isLoading}
      <span
        class="flex items-center gap-1.5 text-[11px] font-medium {lastSaveError ? 'text-red-500' : $updateMutation.isPending ? 'text-gray-400 dark:text-neutral-500' : 'text-emerald-600 dark:text-emerald-400'}"
        aria-live="polite"
      >
        {#if $updateMutation.isPending && dirtyForAutoSave}
          <Loader size={10} />
        {:else if lastSaveError}
          <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
        {:else}
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        {/if}
        {relativeSavedAt()}
      </span>
    {/if}
  </header>

  {#if $resumeQuery.isLoading}
    <div class="flex justify-center py-12" role="status" aria-label={t('common.loading')}>
      <Loader size={20} />
    </div>
  {:else if $resumeQuery.isError}
    <div
      class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950"
      role="alert"
    >
      <p class="text-sm text-red-800 dark:text-red-200">
        {t('errors.loadFailed')}
      </p>
      <Button type="button" variant="solid" class="mt-4" onclick={() => $resumeQuery.refetch()}>
        {t('common.retry')}
      </Button>
    </div>
  {:else}
    <h1 class="mb-6 text-xl font-semibold text-gray-900 dark:text-neutral-100">
      {t('careers.editResume.pageTitle')}
    </h1>

    {#if resumeId}
      <div class="mb-6">
        <ResumeQualityCard resumeId={resumeId} detailsHref="/my-profile/scores" />
      </div>
    {/if}

    <form
      class="space-y-5"
      onsubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div>
        <Label for="title">{t('careers.editResume.titleLabel')}</Label>
        <Input id="title" bind:value={draft.state.title} placeholder={t('careers.editResume.titlePlaceholder')} />
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label for="fullName">{t('careers.editResume.fullNameLabel')}</Label>
          <Input id="fullName" bind:value={draft.state.fullName} />
        </div>
        <div>
          <Label for="jobTitle">{t('careers.editResume.roleLabel')}</Label>
          <Input id="jobTitle" bind:value={draft.state.jobTitle} />
        </div>
      </div>
      <div>
        <Label for="summary">{t('careers.editResume.summaryLabel')}</Label>
        <Textarea
          id="summary"
          bind:value={draft.state.summary}
          rows={5}
          placeholder={t('careers.editResume.summaryPlaceholder')}
        />
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label for="phone">Telefone</Label>
          <Input id="phone" bind:value={draft.state.phone} />
        </div>
        <div>
          <Label for="location">{t('careers.editResume.locationLabel')}</Label>
          <Input id="location" bind:value={draft.state.location} />
        </div>
        <div>
          <Label for="website">Website</Label>
          <Input id="website" type="url" bind:value={draft.state.website} />
        </div>
        <div>
          <Label for="linkedin">LinkedIn</Label>
          <Input id="linkedin" bind:value={draft.state.linkedin} />
        </div>
        <div>
          <Label for="github">GitHub</Label>
          <Input id="github" bind:value={draft.state.github} />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-4">
        <LinkButton variant="outline"  href="/careers/manage-resumes">Cancelar</LinkButton>
        <Button type="submit" variant="solid" disabled={$updateMutation.isPending}>
          {#if $updateMutation.isPending}
            <Loader size={14} class="mr-2" />
          {:else}
            <Save size={14} class="mr-2" />
          {/if}
          Salvar
        </Button>
      </div>
    </form>
  {/if}
</div>
