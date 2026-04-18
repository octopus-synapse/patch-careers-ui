<script lang="ts">
import { ArrowLeft, Loader2, Save } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, Input, Label, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { useFormDraft } from '$lib/forms/use-form-draft.svelte';

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
let saving = $state(false);

onMount(async () => {
  if (!browser) return;
  try {
    const res = await fetch(`/api/v1/resumes/${resumeId}`, { credentials: 'include' });
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
  } catch {
    toastState.show('Falha ao carregar currículo.', 'danger');
  } finally {
    loading = false;
  }
});

async function save() {
  saving = true;
  try {
    const res = await fetch(`/api/v1/resumes/${resumeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(draft.state),
    });
    if (!res.ok) throw new Error();
    draft.clear();
    toastState.show('Currículo salvo.', 'success');
    goto('/cv');
  } catch {
    toastState.show('Falha ao salvar. Seus dados ficam no rascunho local.', 'danger');
  } finally {
    saving = false;
  }
}
</script>

<svelte:head>
  <title>Editar currículo · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-20 pb-12">
  <header class="mb-6 flex items-center gap-3">
    <a
      href="/cv"
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200"
    >
      <ArrowLeft size={16} />
      Voltar
    </a>
  </header>

  {#if loading}
    <div class="flex justify-center py-12">
      <Loader2 size={20} class="animate-spin text-gray-500" />
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
        <Button type="button" variant="outline" onclick={() => goto('/cv')}>Cancelar</Button>
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
