<script lang="ts">
import { ArrowLeft, Loader2, Save } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, Input, Label, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { useFormDraft } from '$lib/forms/use-form-draft.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const resumeId = $derived($page.params.id);

interface ResumeForm extends Record<string, unknown> {
  title: string;
  fullName: string;
  jobTitle: string;
  summary: string;
  location: string;
  emailContact: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
}

const draft = useFormDraft<ResumeForm>(`cv-${resumeId}`, {
  title: '',
  fullName: '',
  jobTitle: '',
  summary: '',
  location: '',
  emailContact: '',
  phone: '',
  linkedin: '',
  github: '',
  website: '',
});

let loading = $state(true);
let loadError = $state<string | null>(null);
let saving = $state(false);

// Auto-save banner state — relative 'há Ns' is updated by timeTicker elsewhere.
let lastSavedAt = $state<number | null>(null);
let lastSaveError = $state(false);
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let dirtyForAutoSave = $state(false);

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  dirtyForAutoSave = true;
  autoSaveTimer = setTimeout(() => autoSave(), 1200);
}

async function autoSave() {
  if (saving) return;
  saving = true;
  lastSaveError = false;
  try {
    const res = await fetch(`/api/v1/resumes/${resumeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(draft.state),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lastSavedAt = Date.now();
    dirtyForAutoSave = false;
  } catch {
    lastSaveError = true;
  } finally {
    saving = false;
  }
}

function relativeSavedAt(): string {
  if (lastSaveError) return 'Falha ao salvar';
  if (saving && dirtyForAutoSave) return 'Salvando…';
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
  if (!loading && browser) scheduleAutoSave();
});

async function loadResume() {
  if (!browser) return;
  loading = true;
  loadError = null;
  try {
    const res = await fetch(`/api/v1/resumes/${resumeId}`, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const body = (await res.json()) as { data?: { resume?: Partial<ResumeForm> } };
    const r = body.data?.resume;
    if (r) {
      draft.state = {
        title: r.title ?? '',
        fullName: r.fullName ?? '',
        jobTitle: r.jobTitle ?? '',
        summary: r.summary ?? '',
        location: r.location ?? '',
        emailContact: r.emailContact ?? '',
        phone: r.phone ?? '',
        linkedin: r.linkedin ?? '',
        github: r.github ?? '',
        website: r.website ?? '',
      };
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'unknown';
    toastState.show(t('errors.loadFailed'), 'danger');
  } finally {
    loading = false;
  }
}

onMount(loadResume);

async function save() {
  saving = true;
  try {
    const res = await fetch(`/api/v1/resumes/${resumeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(draft.state),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    draft.clear();
    toastState.show(t('common.saved'), 'success');
    goto('/careers/manage-resumes');
  } catch {
    toastState.show(t('errors.saveFailed'), 'danger');
  } finally {
    saving = false;
  }
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
    {#if !loading}
      <span
        class="flex items-center gap-1.5 text-[11px] font-medium {lastSaveError ? 'text-red-500' : saving ? 'text-gray-400 dark:text-neutral-500' : 'text-emerald-600 dark:text-emerald-400'}"
        aria-live="polite"
      >
        {#if saving && dirtyForAutoSave}
          <Loader2 size={10} class="animate-spin" />
        {:else if lastSaveError}
          <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
        {:else}
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        {/if}
        {relativeSavedAt()}
      </span>
    {/if}
  </header>

  {#if loading}
    <div class="flex justify-center py-12" role="status" aria-label={t('common.loading')}>
      <Loader2 size={20} class="animate-spin text-gray-500" />
    </div>
  {:else if loadError}
    <div
      class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950"
      role="alert"
    >
      <p class="text-sm text-red-800 dark:text-red-200">
        {t('errors.loadFailed')}
      </p>
      <Button type="button" variant="solid" class="mt-4" onclick={loadResume}>
        {t('common.retry')}
      </Button>
    </div>
  {:else}
    <h1 class="mb-6 text-xl font-semibold text-gray-900 dark:text-neutral-100">
      Editar currículo
    </h1>

    <form
      class="space-y-5"
      onsubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div>
        <Label for="title">Título do currículo</Label>
        <Input id="title" bind:value={draft.state.title} placeholder="Ex: Backend Pleno 2026" />
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label for="fullName">Nome completo</Label>
          <Input id="fullName" bind:value={draft.state.fullName} />
        </div>
        <div>
          <Label for="jobTitle">Cargo / role</Label>
          <Input id="jobTitle" bind:value={draft.state.jobTitle} />
        </div>
      </div>
      <div>
        <Label for="summary">Resumo profissional</Label>
        <textarea
          id="summary"
          bind:value={draft.state.summary}
          rows="5"
          class="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none focus:border-cyan-500 dark:border-neutral-700 dark:bg-neutral-800"
          placeholder="2–3 parágrafos sobre sua trajetória"
        ></textarea>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label for="emailContact">Email de contato</Label>
          <Input id="emailContact" type="email" bind:value={draft.state.emailContact} />
        </div>
        <div>
          <Label for="phone">Telefone</Label>
          <Input id="phone" bind:value={draft.state.phone} />
        </div>
        <div>
          <Label for="location">Localização</Label>
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
        <Button type="button" variant="outline" onclick={() => goto('/careers/manage-resumes')}>Cancelar</Button>
        <Button type="submit" variant="solid" disabled={saving}>
          {#if saving}
            <Loader2 size={14} class="mr-2 animate-spin" />
          {:else}
            <Save size={14} class="mr-2" />
          {/if}
          Salvar
        </Button>
      </div>
    </form>
  {/if}
</div>
