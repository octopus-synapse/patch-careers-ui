<!--
  Resume import hub — one-stop onboarding path for users who already have
  their data somewhere. Supports GitHub (stack), LinkedIn (placeholder),
  and PDF upload.
-->
<script lang="ts">
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import {
  postV1ResumesImportsGithub,
  postV1ResumesImportsLinkedin,
  postV1ResumesImportsPdf,
} from 'api-client';
import { FileText, Github, Linkedin, Upload } from 'lucide-svelte';
import { Button, Loader, toastState } from 'ui';
import { goto } from '$app/navigation';

let githubLoading = $state(false);
let linkedinLoading = $state(false);
let pdfLoading = $state(false);
let pdfError = $state<string | null>(null);

async function importGitHub() {
  githubLoading = true;
  try {
    const res = await postV1ResumesImportsGithub();
    toastState.show(
      `Importado: ${res.primaryStack.length} skills, ${res.buildPostsCreated} posts de build.`,
      'success',
    );
  } catch (err) {
    handleApiError(err);
  } finally {
    githubLoading = false;
  }
}

async function importLinkedIn() {
  linkedinLoading = true;
  try {
    await postV1ResumesImportsLinkedin();
    toastState.show('LinkedIn importado.', 'success');
  } catch {
    // Endpoint returns 503 "not implemented yet".
    toastState.show(
      'Import do LinkedIn ainda em construção — use PDF ou GitHub por enquanto.',
      'info',
    );
  } finally {
    linkedinLoading = false;
  }
}

async function uploadPdf(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  pdfError = null;
  pdfLoading = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const body = await postV1ResumesImportsPdf({ data: formData });
    toastState.show('PDF enviado. Processando…', 'success');
    if (body?.resumeId) goto('/onboarding/review');
  } catch (err) {
    pdfError = err instanceof Error ? err.message : 'Falha ao enviar PDF.';
  } finally {
    pdfLoading = false;
    target.value = '';
  }
}
</script>

<svelte:head>
  <title>Importar currículo · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <header class="mb-8">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
      Importar currículo
    </h1>
    <p class="mt-2 text-sm text-gray-500 dark:text-neutral-500">
      Pule digitação — traga o que você já tem do LinkedIn, GitHub ou de um PDF.
    </p>
  </header>

  <div class="space-y-4">
    <!-- GitHub -->
    <div class="flex items-center justify-between rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
      <div class="flex items-start gap-3">
        <Github size={24} class="mt-0.5 text-gray-700 dark:text-neutral-300" />
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">GitHub</h2>
          <p class="text-xs text-gray-500 dark:text-neutral-500">
            Importa stack principal, linguagens e posts de "build in public".
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onclick={importGitHub} disabled={githubLoading}>
        {#if githubLoading}
          <Loader size={14} />
        {:else}
          Importar
        {/if}
      </Button>
    </div>

    <!-- LinkedIn -->
    <div class="flex items-center justify-between rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
      <div class="flex items-start gap-3">
        <Linkedin size={24} class="mt-0.5 text-[#0A66C2]" />
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">LinkedIn</h2>
          <p class="text-xs text-gray-500 dark:text-neutral-500">
            Em breve — aguardando integração com a API v2 do LinkedIn.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onclick={importLinkedIn} disabled={linkedinLoading}>
        {#if linkedinLoading}
          <Loader size={14} />
        {:else}
          Tentar
        {/if}
      </Button>
    </div>

    <!-- PDF -->
    <div class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
      <div class="flex items-start gap-3">
        <FileText size={24} class="mt-0.5 text-gray-700 dark:text-neutral-300" />
        <div class="flex-1">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">Upload de PDF</h2>
          <p class="text-xs text-gray-500 dark:text-neutral-500">
            Envie seu currículo em PDF e nós extraímos as seções automaticamente.
          </p>
          <label
            class="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {#if pdfLoading}
              <Loader size={14} />
              Enviando…
            {:else}
              <Upload size={14} />
              Escolher arquivo (.pdf)
            {/if}
            <input
              type="file"
              accept="application/pdf"
              class="sr-only"
              disabled={pdfLoading}
              onchange={uploadPdf}
            />
          </label>
          {#if pdfError}
            <p class="mt-2 text-xs text-red-500" role="alert">{pdfError}</p>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="mt-8 text-center">
    <a
      href="/onboarding/start"
      class="text-xs text-gray-500 hover:underline dark:text-neutral-500"
    >
      ou preencher manualmente →
    </a>
  </div>
</div>
