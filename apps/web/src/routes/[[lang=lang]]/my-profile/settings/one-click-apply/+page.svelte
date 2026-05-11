<!--
  One-Click Apply — configure what gets auto-attached when the user clicks
  "Apply" on a job without opening a modal:
  - primary resume (defaults to the master)
  - cover letter template (freeform text with {{job.title}}, {{job.company}} tokens)
  - preferred tailoring mode (keep verbatim vs AI-tailor)
-->
<script lang="ts">
import {
  createGetV1Resumes,
  createGetV1UsersMeOneClickApply,
  isApiError,
  putV1UsersMeOneClickApply,
} from 'api-client';
import { locale } from '$lib/state/locale.svelte';
const t = $derived(locale.t);
import { FileText, Zap } from 'lucide-svelte';
import { Button, Checkbox, Label, Loader, Radio, Select, Textarea, toastState } from 'ui';
import { browser } from '$app/environment';
import { useFormDraft } from '$lib/state/use-form-draft.svelte';

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

const resumesQuery = createGetV1Resumes(
  { page: 1, limit: 20 },
  { query: { enabled: () => browser} },
);
const resumes = $derived.by(() => {
  const d = $resumesQuery.data as Record<string, unknown> | undefined;
  return (
    (d?.items as Array<{ id: string; title: string | null }> | undefined) ??
    (d?.resumes as Array<{ id: string; title: string | null }> | undefined) ??
    []
  );
});

let saving = $state(false);

const configQuery = createGetV1UsersMeOneClickApply({
  query: { enabled: () => browser },
});

const loading = $derived($configQuery.isLoading);

$effect(() => {
  const data = $configQuery.data?.data;
  if (data) draft.state = data as Preferences;
});

async function save() {
  saving = true;
  try {
    await putV1UsersMeOneClickApply(draft.state);
    toastState.show(t('actions.savedPreferences'), 'success');
  } catch (err) {
    toastState.show(
      isApiError(err) ? err.message : 'Falha ao salvar. Rascunho local preservado.',
      'danger',
    );
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
      <Loader size={20} />
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
        <Checkbox
          bind:checked={draft.state.enabled}
          class="gap-3"
          label="Ativar One-Click Apply"
          description={'Quando desligado, clicar "Aplicar" abre o modal padrão.'}
        />
      </section>

      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          <FileText size={14} />
          Currículo padrão
        </h2>
        <Label for="resume">Qual currículo usar</Label>
        <Select id="resume" bind:value={draft.state.resumeId} class="mt-1">
          <option value="">— Primary resume (master) —</option>
          {#each resumes as r}
            <option value={r.id}>{r.title ?? 'Sem título'}</option>
          {/each}
        </Select>
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
        <Textarea
          bind:value={draft.state.coverLetterTemplate}
          rows={8}
          class="font-mono text-xs"
        />
      </section>

      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          Ajuste do currículo
        </h2>
        <div class="space-y-2">
          <Radio
            name="tailoringMode"
            value="VERBATIM"
            bind:group={draft.state.tailoringMode}
            class="gap-3"
            label="Enviar como está (verbatim)"
            description="O currículo master é enviado sem modificações."
          />
          <Radio
            name="tailoringMode"
            value="AI_TAILOR"
            bind:group={draft.state.tailoringMode}
            class="gap-3"
            label="Ajustar com IA por vaga"
            description="O Patch reordena seções, destaca skills relevantes e gera uma versão otimizada."
          />
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          Também anexar
        </h2>
        <Checkbox bind:checked={draft.state.alsoAttach.githubUrl} label="Link do GitHub" />
        <Checkbox bind:checked={draft.state.alsoAttach.linkedinUrl} label="Link do LinkedIn" class="mt-2" />
      </section>

      <div class="flex justify-end">
        <Button type="submit" variant="solid" disabled={saving}>
          {#if saving}
            <Loader size={14} class="mr-2" />
          {/if}
          Salvar preferências
        </Button>
      </div>
    </form>
  {/if}
</div>
