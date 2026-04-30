<!--
  ExportMenu — dropdown that lets the user download a resume in any of the
  backend-supported formats: PDF, DOCX, JSON Resume, LaTeX.
-->
<script lang="ts">
  /**
   * ExportMenu — burra: chama os endpoints de export do backend.
   * Backend retorna `void` no schema OpenAPI; cast local da resposta.
   */
import {
  exportApiV1ExportJson,
  exportApiV1ExportLatex,
  exportResumeDocx,
  exportUserResumePdf,
} from 'api-client';
import { Download, FileCode, FileJson, FileText, FileType } from 'lucide-svelte';
import { Button, Dropdown, Loader, toastState } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

interface Props {
  /** Required for DOCX (current user only). For per-resume formats, pass resumeId. */
  userId?: string;
  resumeId?: string;
  filenameHint?: string;
}

let { userId, resumeId, filenameHint = 'resume' }: Props = $props();

let open = $state(false);
let loading = $state<string | null>(null);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPdf() {
  if (!userId) return;
  loading = 'pdf';
  try {
    const res = (await exportUserResumePdf(userId)) as unknown as
      | { pdf?: string; filename?: string }
      | undefined;
    if (!res?.pdf) throw new Error();
    const bytes = Uint8Array.from(atob(res.pdf), (c) => c.charCodeAt(0));
    downloadBlob(
      new Blob([bytes], { type: 'application/pdf' }),
      res.filename ?? `${filenameHint}.pdf`,
    );
  } catch {
    toastState.show(t('errors.exportPdfFailed'), 'danger');
  } finally {
    loading = null;
    open = false;
  }
}

async function downloadDocx() {
  loading = 'docx';
  try {
    const res = (await exportResumeDocx()) as unknown as
      | { docx?: string; filename?: string }
      | undefined;
    if (!res?.docx) throw new Error();
    const bytes = Uint8Array.from(atob(res.docx), (c) => c.charCodeAt(0));
    downloadBlob(
      new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      res.filename ?? `${filenameHint}.docx`,
    );
  } catch {
    toastState.show(t('errors.exportDocxFailed'), 'danger');
  } finally {
    loading = null;
    open = false;
  }
}

async function downloadJson() {
  if (!resumeId) return;
  loading = 'json';
  try {
    const res = (await exportApiV1ExportJson(resumeId)) as unknown;
    const blob = new Blob([JSON.stringify(res ?? {}, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `${filenameHint}.json`);
  } catch {
    toastState.show(t('errors.exportJsonFailed'), 'danger');
  } finally {
    loading = null;
    open = false;
  }
}

async function downloadLatex() {
  if (!resumeId) return;
  loading = 'latex';
  try {
    const res = (await exportApiV1ExportLatex(resumeId)) as unknown as
      | { latex?: string; filename?: string }
      | undefined;
    const blob = new Blob([res?.latex ?? ''], { type: 'application/x-tex' });
    downloadBlob(blob, res?.filename ?? `${filenameHint}.tex`);
  } catch {
    toastState.show(t('errors.exportLatexFailed'), 'danger');
  } finally {
    loading = null;
    open = false;
  }
}
</script>

<Dropdown {open} onclose={() => (open = false)} align="right">
  {#snippet trigger()}
    <Button variant="outline" size="sm" onclick={() => (open = !open)}>
      <Download size={14} />
      Exportar
    </Button>
  {/snippet}

  <div class="min-w-[200px] py-1">
    {#if userId}
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
        onclick={downloadPdf}
        disabled={loading !== null}
      >
        {#if loading === 'pdf'}
          <Loader size={14} />
        {:else}
          <FileType size={14} />
        {/if}
        PDF (ATS-ready)
      </button>
    {/if}
    <button
      type="button"
      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
      onclick={downloadDocx}
      disabled={loading !== null}
    >
      {#if loading === 'docx'}
        <Loader size={14} />
      {:else}
        <FileText size={14} />
      {/if}
      Word (.docx)
    </button>
    {#if resumeId}
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
        onclick={downloadJson}
        disabled={loading !== null}
      >
        {#if loading === 'json'}
          <Loader size={14} />
        {:else}
          <FileJson size={14} />
        {/if}
        JSON Resume
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
        onclick={downloadLatex}
        disabled={loading !== null}
      >
        {#if loading === 'latex'}
          <Loader size={14} />
        {:else}
          <FileCode size={14} />
        {/if}
        LaTeX
      </button>
    {/if}
  </div>
</Dropdown>
