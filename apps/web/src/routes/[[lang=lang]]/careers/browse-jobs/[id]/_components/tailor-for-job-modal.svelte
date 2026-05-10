<script lang="ts">
/**
 * TailorForJobModal
 *
 * Opens from the job detail page. Lets the user pick which of their resumes
 * to tailor, previews the job context (auto-filled from the job detail), and
 * kicks off `POST /v1/resumes/:id/tailor` via Orval. On success, renders the
 * server-supplied `changes[]` (path/op/before/after/highlights) — the
 * frontend doesn't compute any diff itself.
 */
import { createGetV1Resumes, postV1ResumesResumeIdTailor } from 'api-client';
import type { PostV1ResumesResumeIdTailorMutationResponse } from 'api-client';
import { Sparkles } from 'lucide-svelte';
import { Button, Loader, Modal, Textarea, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

type Props = {
  open: boolean;
  onClose: () => void;
  jobId?: string;
  jobTitle?: string;
  jobCompany?: string;
  jobDescription?: string;
};

let { open, onClose, jobId, jobTitle, jobCompany, jobDescription }: Props = $props();

const resumesQuery = createGetV1Resumes(
  { page: '1', limit: '20' },
  { query: { enabled: browser && open } },
);

const resumes = $derived($resumesQuery.data?.items);

let selectedResumeId = $state('');
let jdText = $state('');
let submitting = $state(false);
let result = $state<PostV1ResumesResumeIdTailorMutationResponse | null>(null);

// Auto-select first resume + prefill JD when modal opens or props change.
$effect(() => {
  if (!open) {
    selectedResumeId = '';
    jdText = '';
    result = null;
    return;
  }
  if (!selectedResumeId && resumes && resumes.length > 0) selectedResumeId = resumes[0].id;
  if (!jdText) {
    const parts = [jobTitle, jobCompany, jobDescription].filter(Boolean);
    jdText = parts.join('\n\n');
  }
});

async function handleSubmit() {
  if (submitting || !selectedResumeId) return;
  submitting = true;
  try {
    result = await postV1ResumesResumeIdTailor(selectedResumeId, {
      jobId,
      jobTitle,
      jobCompany,
      jobDescription: jdText || jobDescription,
    });
  } catch (err) {
    toastState.show(
      err instanceof Error ? err.message : 'Falha ao personalizar o currículo',
      'danger',
    );
  } finally {
    submitting = false;
  }
}

function goToEdit() {
  if (!result) return;
  const suffix = result.versionId ? `?version=${result.versionId}` : '';
  goto(`/careers/manage-resumes/${selectedResumeId}/edit${suffix}`);
  onClose();
}
</script>

<Modal {open} {onClose}>
	{#snippet title()}
		<div class="flex items-center gap-2">
			<Sparkles size={18} class="text-violet-600 dark:text-violet-400" />
			<span>Personalizar CV com IA</span>
		</div>
	{/snippet}

	{#if !result}
		<div class="space-y-4">
			<p class="text-xs text-gray-500 dark:text-neutral-500">
				Escolha seu CV base. Vamos reescrever os bullets pra destacar o que a vaga pede — sem inventar experiência que você não tem.
			</p>

			<label class="block">
				<span class="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-400">
					CV base
				</span>
				{#if $resumesQuery.isLoading}
					<div class="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-neutral-500">
						<Loader size={12} /> carregando…
					</div>
				{:else if !resumes || resumes.length === 0}
					<p class="mt-1 text-xs text-gray-400 dark:text-neutral-500">
						Você ainda não tem nenhum CV. Crie um em "Meus currículos".
					</p>
				{:else}
					<select
						bind:value={selectedResumeId}
						class="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
					>
						{#each resumes as r}
							<option value={r.id}>{r.title ?? `CV #${r.id.slice(0, 6)}`}</option>
						{/each}
					</select>
				{/if}
			</label>

			<label class="block">
				<span class="text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-400">
					Descrição da vaga
				</span>
				<Textarea
					rows={6}
					bind:value={jdText}
					placeholder="Cole aqui o texto da vaga…"
				/>
				<p class="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">
					Já preenchemos com o que extraímos da página. Edite se quiser destacar algum trecho.
				</p>
			</label>

			<div class="flex flex-wrap items-center justify-end gap-2 border-t pt-3 border-gray-200 dark:border-neutral-700">
				<Button variant="ghost" size="sm" onclick={onClose} disabled={submitting}>Cancelar</Button>
				<Button
					variant="solid"
					size="sm"
					onclick={handleSubmit}
					disabled={submitting || !selectedResumeId || !jdText.trim()}
				>
					{#if submitting}
						<Loader size={14} /> Gerando…
					{:else}
						<Sparkles size={14} /> Gerar versão personalizada
					{/if}
				</Button>
			</div>
		</div>
	{:else}
		<div class="space-y-3">
			<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
				<p class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
					{result.label ? `Versão ${result.label} pronta.` : 'Versão personalizada pronta.'}
				</p>
				<p class="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
					{result.changes.length} alterações. Nenhuma experiência inventada.
				</p>
			</div>

			<div class="max-h-72 space-y-3 overflow-y-auto">
				{#each result.changes as change}
					<div class="rounded-lg border border-gray-200 p-3 dark:border-neutral-700/50">
						<p class="mb-1 text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500">
							{change.op === 'add' ? 'Adicionado' : change.op === 'remove' ? 'Removido' : 'Antes'} · {change.path.join('.')}
						</p>
						{#if change.before != null}
							<p class="mb-2 text-xs text-gray-600 line-through dark:text-neutral-500">{String(change.before)}</p>
						{/if}
						{#if change.after != null}
							<p class="mb-1 text-[10px] uppercase tracking-widest text-violet-600 dark:text-violet-400">Depois</p>
							<p class="text-xs text-gray-800 dark:text-neutral-200">{String(change.after)}</p>
						{/if}
						{#if change.highlights && change.highlights.length > 0}
							<div class="mt-2 flex flex-wrap gap-1">
								{#each change.highlights as h}
									<span class="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{h}</span>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="flex flex-wrap items-center justify-end gap-2 border-t pt-3 border-gray-200 dark:border-neutral-700">
				<Button variant="ghost" size="sm" onclick={onClose}>Fechar</Button>
				<Button variant="solid" size="sm" onclick={goToEdit}>
					Abrir versão personalizada
				</Button>
			</div>
		</div>
	{/if}
</Modal>
