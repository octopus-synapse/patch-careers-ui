<!--
  One-Click Apply — configure what gets auto-attached when the user clicks
  "Apply" on a job without opening a modal:
  - primary resume (defaults to the master)
  - cover letter template (freeform text with {{job.title}}, {{job.company}} tokens)
  - preferred tailoring mode (keep verbatim vs AI-tailor)
-->
<script lang="ts">
import { createResumesGetAllUserResumes } from 'api-client';
import { FileText, Loader2, Zap } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, Input, Label, toastState } from 'ui';
import { browser } from '$app/environment';
import { useFormDraft } from '$lib/forms/use-form-draft.svelte';

interface Preferences extends Record<string, unknown> {
  enabled: boolean;
  resumeId: string;
  coverLetterTemplate: string;
  tailoringMode: 'VERBATIM' | 'AI_TAILOR';
  alsoAttach: {
    githubUrl: boolean;
    linkedinUrl: boolean;
  };
}

const draft = useFormDraft<Preferences>('settings:one-click-apply', {
  enabled: false,
  resumeId: '',
  coverLetterTemplate:
    'Olá, equipe {{job.company}}!\n\nVi a vaga de {{job.title}} e acredito que minha experiência em {{user.primaryStack}} se encaixa bem. Envio em anexo meu currículo pronto pra análise.\n\nAbraço,\n{{user.name}}',
  tailoringMode: 'AI_TAILOR',
  alsoAttach: { githubUrl: true, linkedinUrl: true },
});

const resumesQuery = createResumesGetAllUserResumes(
  () => ({ page: 1, limit: 20 }),
  () => ({ query: { enabled: browser } }),
);
const resumes = $derived.by(() => {
  const d = resumesQuery.data as Record<string, unknown> | undefined;
  return (d?.resumes as Array<{ id: string; title: string | null }> | undefined) ?? [];
});

let loading = $state(true);
let saving = $state(false);

onMount(async () => {
  try {
    const res = await fetch('/api/v1/users/me/one-click-apply', { credentials: 'include' });
    if (res.ok) {
      const body = (await res.json()) as { data?: Preferences };
      if (body.data) draft.state = body.data;
    }
  } catch {
    // endpoint might not exist yet — we fall back to draft defaults.
  } finally {
    loading = false;
  }
});

async function save() {
  saving = true;
  try {
    const res = await fetch('/api/v1/users/me/one-click-apply', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(draft.state),
    });
    if (!res.ok) throw new Error();
    toastState.show('Preferências salvas.', 'success');
  } catch {
    toastState.show('Falha ao salvar. Rascunho local preservado.', 'danger');
  } finally {
    saving = false;
  }
}
</script>

<svelte:head>
  <title>One-Click Apply · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <header class="mb-6 flex items-start gap-3">
    <Zap class="mt-1 text-cyan-500" size={20} />
    <div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">One-Click Apply</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
        Configure o que envia quando você clica "Aplicar" direto em uma vaga, sem abrir modal.
      </p>
    </div>
  </header>

  {#if loading}
    <div class="flex justify-center py-12">
      <Loader2 size={20} class="animate-spin text-gray-500" />
    </div>
  {:else}
    <form
      class="space-y-6"
      onsubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <label class="flex items-start gap-3">
          <input type="checkbox" bind:checked={draft.state.enabled} class="mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">
              Ativar One-Click Apply
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-500">
              Quando desligado, clicar "Aplicar" abre o modal padrão.
            </p>
          </div>
        </label>
      </section>

      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          <FileText size={14} />
          Currículo padrão
        </h2>
        <Label for="resume">Qual currículo usar</Label>
        <select
          id="resume"
          bind:value={draft.state.resumeId}
          class="mt-1 block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">— Primary resume (master) —</option>
          {#each resumes as r}
            <option value={r.id}>{r.title ?? 'Sem título'}</option>
          {/each}
        </select>
      </section>

      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          Template de cover letter
        </h2>
        <p class="mb-2 text-xs text-gray-500 dark:text-neutral-500">
          Use <code class="rounded bg-gray-100 px-1 dark:bg-neutral-800">{'{{job.title}}'}</code>,
          <code class="rounded bg-gray-100 px-1 dark:bg-neutral-800">{'{{job.company}}'}</code>,
          <code class="rounded bg-gray-100 px-1 dark:bg-neutral-800">{'{{user.name}}'}</code>.
        </p>
        <textarea
          bind:value={draft.state.coverLetterTemplate}
          rows="8"
          class="block w-full rounded-md border border-gray-200 bg-white p-3 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-800"
        ></textarea>
      </section>

      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          Ajuste do currículo
        </h2>
        <div class="space-y-2">
          <label class="flex items-start gap-3">
            <input
              type="radio"
              name="tailoringMode"
              value="VERBATIM"
              checked={draft.state.tailoringMode === 'VERBATIM'}
              onchange={() => (draft.state.tailoringMode = 'VERBATIM')}
              class="mt-1"
            />
            <div>
              <p class="text-sm text-gray-900 dark:text-neutral-100">
                Enviar como está (verbatim)
              </p>
              <p class="text-xs text-gray-500 dark:text-neutral-500">
                O currículo master é enviado sem modificações.
              </p>
            </div>
          </label>
          <label class="flex items-start gap-3">
            <input
              type="radio"
              name="tailoringMode"
              value="AI_TAILOR"
              checked={draft.state.tailoringMode === 'AI_TAILOR'}
              onchange={() => (draft.state.tailoringMode = 'AI_TAILOR')}
              class="mt-1"
            />
            <div>
              <p class="text-sm text-gray-900 dark:text-neutral-100">
                Ajustar com IA por vaga
              </p>
              <p class="text-xs text-gray-500 dark:text-neutral-500">
                O Patch reordena seções, destaca skills relevantes e gera uma versão otimizada.
              </p>
            </div>
          </label>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          Também anexar
        </h2>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
          <input type="checkbox" bind:checked={draft.state.alsoAttach.githubUrl} />
          Link do GitHub
        </label>
        <label class="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
          <input type="checkbox" bind:checked={draft.state.alsoAttach.linkedinUrl} />
          Link do LinkedIn
        </label>
      </section>

      <div class="flex justify-end">
        <Button type="submit" variant="solid" disabled={saving}>
          {#if saving}
            <Loader2 size={14} class="mr-2 animate-spin" />
          {/if}
          Salvar preferências
        </Button>
      </div>
    </form>
  {/if}
</div>
