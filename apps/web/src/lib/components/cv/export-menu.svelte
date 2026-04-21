<!--
  ExportMenu — dropdown that lets the user download a resume in any of the
  backend-supported formats: PDF, DOCX, JSON Resume, LaTeX.
-->
<script lang="ts">
import {
  exportDownloadUserResumePDF,
  exportExportJson,
  exportExportLatex,
  exportExportResumeDOCX,
} from 'api-client';
import { Download, FileCode, FileJson, FileText, FileType, Loader2 } from 'lucide-svelte';
import { Button, Dropdown, toastState } from 'ui';
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
    const res = (await exportDownloadUserResumePDF(userId)) as unknown as Record<string, unknown>;
    const data = res?.data as { pdf?: string; filename?: string } | undefined;
    if (!data?.pdf) throw new Error();
    const bytes = Uint8Array.from(atob(data.pdf), (c) => c.charCodeAt(0));
    downloadBlob(
      new Blob([bytes], { type: 'application/pdf' }),
      data.filename ?? `${filenameHint}.pdf`,
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
    const res = (await exportExportResumeDOCX()) as unknown as Record<string, unknown>;
    const data = res?.data as { docx?: string; filename?: string } | undefined;
    if (!data?.docx) throw new Error();
    const bytes = Uint8Array.from(atob(data.docx), (c) => c.charCodeAt(0));
    downloadBlob(
      new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      data.filename ?? `${filenameHint}.docx`,
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
    const res = (await exportExportJson(resumeId)) as unknown as Record<string, unknown>;
    const blob = new Blob([JSON.stringify(res?.data ?? res, null, 2)], {
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
    const res = (await exportExportLatex(resumeId)) as unknown as Record<string, unknown>;
    const data = res?.data as { latex?: string; filename?: string } | undefined;
    const blob = new Blob([data?.latex ?? ''], { type: 'application/x-tex' });
    downloadBlob(blob, data?.filename ?? `${filenameHint}.tex`);
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
          <Loader2 size={14} class="animate-spin" />
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
        <Loader2 size={14} class="animate-spin" />
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
          <Loader2 size={14} class="animate-spin" />
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
          <Loader2 size={14} class="animate-spin" />
        {:else}
          <FileCode size={14} />
        {/if}
        LaTeX
      </button>
    {/if}
  </div>
</Dropdown>
