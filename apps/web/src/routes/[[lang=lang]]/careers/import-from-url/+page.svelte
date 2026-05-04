<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  jobsMineQueryKey,
  jobsCreate,
  jobsImportFromUrl,
} from 'api-client';
import type { JobsCreateMutationRequest, JobsCreateMutationRequestJobTypeEnumKey } from 'api-client';
import { ArrowRight, Globe, Sparkles } from 'lucide-svelte';
import { Badge, Button, Input, Label, Loader, Textarea, toastState } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

type Preview = {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  salaryRange: string;
  applyUrl: string;
  jobType: JobsCreateMutationRequestJobTypeEnumKey | null;
  remotePolicy: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
};

type RawPreview = Partial<Record<keyof Preview, unknown>>;

function normalizePreview(raw: RawPreview): Preview {
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    company: typeof raw.company === 'string' ? raw.company : '',
    location: typeof raw.location === 'string' ? raw.location : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    requirements: Array.isArray(raw.requirements) ? (raw.requirements as string[]) : [],
    skills: Array.isArray(raw.skills) ? (raw.skills as string[]) : [],
    salaryRange: typeof raw.salaryRange === 'string' ? raw.salaryRange : '',
    applyUrl: typeof raw.applyUrl === 'string' ? raw.applyUrl : '',
    jobType: (raw.jobType as JobsCreateMutationRequestJobTypeEnumKey | null) ?? null,
    remotePolicy: (raw.remotePolicy as 'REMOTE' | 'HYBRID' | 'ONSITE' | null) ?? null,
  };
}

let url = $state('');
let previewing = $state(false);
let preview = $state<Preview | null>(null);
let error = $state('');
let saving = $state(false);

async function runPreview() {
  if (!url.trim() || previewing) return;
  previewing = true;
  error = '';
  try {
    const res = (await jobsImportFromUrl({ url: url.trim() })) as unknown as {
      source?: string;
      preview?: RawPreview;
    };
    if (res.preview) preview = normalizePreview(res.preview);
    else error = 'Não conseguimos extrair campos dessa página.';
  } catch (err) {
    error =
      err instanceof Error ? err.message : 'Falha ao importar. Verifique a URL e tente de novo.';
  } finally {
    previewing = false;
  }
}

async function confirmCreate() {
  if (!preview) return;
  saving = true;
  try {
    const body: JobsCreateMutationRequest = {
      title: preview.title.trim() || 'Sem título',
      company: preview.company.trim() || 'Sem empresa',
      location: preview.location.trim() || undefined,
      description: preview.description.trim() || 'Sem descrição',
      jobType: (preview.jobType ?? 'FULL_TIME') as JobsCreateMutationRequestJobTypeEnumKey,
      remotePolicy: preview.remotePolicy ?? undefined,
      salaryRange: preview.salaryRange.trim() || undefined,
      applyUrl: preview.applyUrl.trim() || url,
      skills: preview.skills,
      requirements: preview.requirements,
    };
    await jobsCreate(body);
    await queryClient.invalidateQueries({ queryKey: jobsMineQueryKey() });
    toastState.show('Vaga criada a partir da URL.', 'success');
    goto('/recruiting/jobs');
  } catch (err) {
    toastState.show(err instanceof Error ? err.message : 'Falha ao criar vaga.', 'danger');
  } finally {
    saving = false;
  }
}
</script>

<svelte:head>
	<title>Importar vaga por URL · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 px-4 pt-20 pb-12">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-neutral-100">
			<Sparkles size={18} class="text-cyan-500" />
			Importar vaga por URL
		</h1>
		<p class="text-sm text-gray-500 dark:text-neutral-500">
			Cole o link de uma página de carreira e a gente extrai os campos com IA. Você revê antes de
			publicar.
		</p>
	</header>

	<form onsubmit={(e) => { e.preventDefault(); runPreview(); }} class="space-y-3">
		<Label for="url">URL da vaga</Label>
		<div class="flex gap-2">
			<div class="relative flex-1">
				<Globe size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
				<Input
					id="url"
					type="url"
					bind:value={url}
					placeholder="https://empresa.com/careers/senior-engineer"
					required
					class="pl-9"
				/>
			</div>
			<Button type="submit" disabled={previewing || !url.trim()}>
				{#if previewing}
					<Loader size={14} />
				{:else}
					Buscar
					<ArrowRight size={14} />
				{/if}
			</Button>
		</div>
		{#if error}
			<p role="alert" class="text-xs font-medium text-red-500">{error}</p>
		{/if}
	</form>

	{#if preview}
		<section class="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
			<h2 class="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
				Preview (edite antes de publicar)
			</h2>
			<div class="space-y-4">
				<div>
					<Label for="p-title">Título</Label>
					<Input id="p-title" bind:value={preview.title} />
				</div>
				<div class="grid gap-3 md:grid-cols-2">
					<div>
						<Label for="p-company">Empresa</Label>
						<Input id="p-company" bind:value={preview.company} />
					</div>
					<div>
						<Label for="p-location">Localização</Label>
						<Input id="p-location" bind:value={preview.location} />
					</div>
				</div>
				<div>
					<Label for="p-description">Descrição</Label>
					<Textarea
						id="p-description"
						bind:value={preview.description}
						rows={8}
					/>
				</div>
				<div>
					<Label>Skills extraídas</Label>
					<div class="flex flex-wrap gap-1.5">
						{#each preview.skills ?? [] as skill}
							<Badge intent="accent" size="md">{skill}</Badge>
						{:else}
							<span class="text-xs text-gray-500 dark:text-neutral-500">Nenhuma skill detectada.</span>
						{/each}
					</div>
				</div>
				<div class="grid gap-3 md:grid-cols-2">
					<div>
						<Label for="p-salary">Salário</Label>
						<Input id="p-salary" bind:value={preview.salaryRange} />
					</div>
					<div>
						<Label for="p-apply">Link de inscrição</Label>
						<Input id="p-apply" type="url" bind:value={preview.applyUrl} />
					</div>
				</div>
			</div>

			<div class="mt-5 flex justify-end gap-2">
				<Button variant="ghost" onclick={() => (preview = null)}>Descartar</Button>
				<Button onclick={confirmCreate} disabled={saving}>
					{#if saving}
						<Loader size={14} />
					{:else}
						Publicar vaga
					{/if}
				</Button>
			</div>
		</section>
	{/if}
</div>
