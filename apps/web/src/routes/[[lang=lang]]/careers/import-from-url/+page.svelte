<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import {
  getV1JobsApplicationsQueryKey,
  postV1Jobs,
  postV1JobsImportFromUrl,
} from 'api-client';
import type { CreateJobRequest, CreateJobRequestJobTypeEnumKey, PostV1JobsImportFromUrl200 } from 'api-client';
import { ArrowRight, Globe, Sparkles } from 'lucide-svelte';
import { Badge, Button, Input, Label, Loader, Textarea, toastState } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

type Preview = PostV1JobsImportFromUrl200['preview'];

let url = $state('');
let previewing = $state(false);
let preview = $state<Preview | null>(null);
// Editable string buffers — bind:value needs strings, preview keeps the
// canonical typed shape from the SDK.
let titleInput = $state('');
let companyInput = $state('');
let locationInput = $state('');
let descriptionInput = $state('');
let salaryInput = $state('');
let applyInput = $state('');
let error = $state('');
let saving = $state(false);

async function runPreview() {
  if (!url.trim() || previewing) return;
  previewing = true;
  error = '';
  try {
    const res = await postV1JobsImportFromUrl({ url: url.trim() });
    if (res.preview) {
      preview = res.preview;
      titleInput = preview.title ?? '';
      companyInput = preview.company ?? '';
      locationInput = preview.location ?? '';
      descriptionInput = preview.description ?? '';
      salaryInput = preview.salaryRange ?? '';
      applyInput = preview.applyUrl ?? '';
    } else {
      error = 'Não conseguimos extrair campos dessa página.';
    }
  } catch (err) {
    error =
      err instanceof Error ? err.message : t('careers.importFromUrl.errorImport');
  } finally {
    previewing = false;
  }
}

async function confirmCreate() {
  if (!preview) return;
  saving = true;
  try {
    const body: CreateJobRequest = {
      title: titleInput.trim() || 'Sem título',
      company: companyInput.trim() || 'Sem empresa',
      location: locationInput.trim() || undefined,
      description: descriptionInput.trim() || 'Sem descrição',
      jobType: (preview.jobType ?? 'FULL_TIME') as CreateJobRequestJobTypeEnumKey,
      remotePolicy: preview.remotePolicy || undefined,
      salaryRange: salaryInput.trim() || undefined,
      applyUrl: applyInput.trim() || url,
      skills: preview.skills,
      requirements: preview.requirements,
    };
    await postV1Jobs(body);
    await queryClient.invalidateQueries({ queryKey: getV1JobsApplicationsQueryKey() });
    toastState.show(t('careers.importFromUrl.toastCreated'), 'success');
    goto('/recruiting/jobs');
  } catch (err) {
    handleApiError(err);
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
			{t('careers.importFromUrl.pageTitle')}
		</h1>
		<p class="text-sm text-gray-500 dark:text-neutral-500">
			Cole o link de uma página de carreira e a gente extrai os campos com IA. Você revê antes de
			publicar.
		</p>
	</header>

	<form onsubmit={(e) => { e.preventDefault(); runPreview(); }} class="space-y-3">
		<Label for="url">{t('careers.importFromUrl.urlLabel')}</Label>
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
				{t('careers.importFromUrl.previewHeading')}
			</h2>
			<div class="space-y-4">
				<div>
					<Label for="p-title">{t('careers.importFromUrl.titleLabel')}</Label>
					<Input id="p-title" bind:value={titleInput} />
				</div>
				<div class="grid gap-3 md:grid-cols-2">
					<div>
						<Label for="p-company">Empresa</Label>
						<Input id="p-company" bind:value={companyInput} />
					</div>
					<div>
						<Label for="p-location">{t('careers.importFromUrl.locationLabel')}</Label>
						<Input id="p-location" bind:value={locationInput} />
					</div>
				</div>
				<div>
					<Label for="p-description">{t('careers.importFromUrl.descriptionLabel')}</Label>
					<Textarea
						id="p-description"
						bind:value={descriptionInput}
						rows={8}
					/>
				</div>
				<div>
					<Label>{t('careers.importFromUrl.skillsExtracted')}</Label>
					<div class="flex flex-wrap gap-1.5">
						{#each preview.skills as skill}
							<Badge intent="accent" size="md">{skill}</Badge>
						{:else}
							<span class="text-xs text-gray-500 dark:text-neutral-500">Nenhuma skill detectada.</span>
						{/each}
					</div>
				</div>
				<div class="grid gap-3 md:grid-cols-2">
					<div>
						<Label for="p-salary">{t('careers.importFromUrl.salaryLabel')}</Label>
						<Input id="p-salary" bind:value={salaryInput} />
					</div>
					<div>
						<Label for="p-apply">{t('careers.importFromUrl.applyUrlLabel')}</Label>
						<Input id="p-apply" type="url" bind:value={applyInput} />
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
