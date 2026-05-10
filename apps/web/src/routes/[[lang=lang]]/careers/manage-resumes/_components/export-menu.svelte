<!--
  ExportMenu — dropdown que dispara o backend pra gerar PDF / DOCX /
  JSON Resume / LaTeX. O backend faz upload pro MinIO e devolve uma URL
  assinada com TTL curto; o browser baixa nativamente via <a download>.
-->
<script lang="ts">
import {
  getV1ExportResumeIdJson,
  getV1ExportResumeIdLatex,
  getV1ExportResumeDocx,
  getV1ExportUserUserIdResumePdf,
} from 'api-client';
import { Download, FileCode, FileJson, FileText, FileType } from 'lucide-svelte';
import { Button, Dropdown, Loader } from 'ui';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';

interface Props {
  /** Required for DOCX (current user only). For per-resume formats, pass resumeId. */
  userId?: string;
  resumeId?: string;
  filenameHint?: string;
}

let { userId, resumeId, filenameHint = 'resume' }: Props = $props();

let open = $state(false);
let loading = $state<string | null>(null);

function triggerDownload(downloadUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// customFetch throws on non-2xx, so a defined response is always the 200
// shape — but the SDK types it as a discriminated union. We narrow once
// per response by checking a 200-only field.
function ensurePresigned<T extends { downloadUrl: string; filename: string }>(
  res: unknown,
): T {
  if (res && typeof res === 'object' && 'downloadUrl' in res) return res as T;
  throw new Error('Backend returned an unexpected response shape');
}

async function downloadPdf() {
  if (!userId) return;
  loading = 'pdf';
  try {
    const res = await getV1ExportUserUserIdResumePdf(userId);
    if (!('pdf' in res)) throw new Error('Backend returned an unexpected response shape');
    const bytes = Uint8Array.from(atob(res.pdf), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, res.filename || `${filenameHint}.pdf`);
    URL.revokeObjectURL(url);
  } catch (err) {
    handleApiError(err);
  } finally {
    loading = null;
    open = false;
  }
}

async function downloadDocx() {
  loading = 'docx';
  try {
    const res = ensurePresigned<{ downloadUrl: string; filename: string }>(
      await getV1ExportResumeDocx(),
    );
    triggerDownload(res.downloadUrl, res.filename);
  } catch (err) {
    handleApiError(err);
  } finally {
    loading = null;
    open = false;
  }
}

async function downloadJson() {
  if (!resumeId) return;
  loading = 'json';
  try {
    const res = ensurePresigned<{ downloadUrl: string; filename: string }>(
      await getV1ExportResumeIdJson(resumeId),
    );
    triggerDownload(res.downloadUrl, res.filename);
  } catch (err) {
    handleApiError(err);
  } finally {
    loading = null;
    open = false;
  }
}

async function downloadLatex() {
  if (!resumeId) return;
  loading = 'latex';
  try {
    const res = ensurePresigned<{ downloadUrl: string; filename: string }>(
      await getV1ExportResumeIdLatex(resumeId),
    );
    triggerDownload(res.downloadUrl, res.filename);
  } catch (err) {
    handleApiError(err);
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
        LaTeX (.tex)
      </button>
    {/if}
  </div>
</Dropdown>
