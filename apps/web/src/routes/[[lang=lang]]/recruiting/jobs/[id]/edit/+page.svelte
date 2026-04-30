<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createJobsFindById,
  createJobsUpdate,
  getJobsFindByIdQueryKey,
  getJobsGetMyJobsQueryKey,
} from 'api-client';
import type { UpdateJobDto } from 'api-client';

import { Button, Input, Label, Loader, Textarea } from 'ui';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();
const jobId = $derived($page.params.id ?? '');

const jobQuery = createJobsFindById(() => jobId);
const job = $derived(jobQuery.data);

let title = $state('');
let company = $state('');
let location = $state('');
let description = $state('');
let salaryRange = $state('');
let applyUrl = $state('');
let skillsCsv = $state('');
let hydrated = $state(false);
let serverError = $state('');

$effect(() => {
  if (job && !hydrated) {
    title = job.title ?? '';
    company = job.company ?? '';
    location = job.location ?? '';
    description = job.description ?? '';
    salaryRange = job.salaryRange ?? '';
    applyUrl = job.applyUrl ?? '';
    skillsCsv = Array.isArray(job.skills) ? job.skills.join(', ') : '';
    hydrated = true;
  }
});

const update = createJobsUpdate(() => ({
  mutation: {
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getJobsGetMyJobsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getJobsFindByIdQueryKey(jobId) }),
      ]);
      goto('/recruiting/jobs');
    },
    onError(err: unknown) {
      serverError = err instanceof Error ? err.message : t('auth.shared.errorGeneric');
    },
  },
}));

async function onSubmit(e: Event) {
  e.preventDefault();
  serverError = '';
  const body: UpdateJobDto = {
    title: title.trim(),
    company: company.trim(),
    location: location.trim() || undefined,
    description: description.trim(),
    salaryRange: salaryRange.trim() || undefined,
    applyUrl: applyUrl.trim() || undefined,
    skills: skillsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
  await update.mutateAsync({ id: jobId, data: body });
}
</script>

<svelte:head>
	<title>{t('company.jobs.edit.pageTitle')}</title>
</svelte:head>

{#if jobQuery.isLoading}
	<div class="flex items-center justify-center py-12">
		<Loader size={24} />
	</div>
{:else if !job}
	<div class="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
		{t('company.jobs.edit.notFound')}
	</div>
{:else}
	<div class="max-w-2xl space-y-6">
		<header>
			<h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
				{t('company.jobs.edit.title')}
			</h1>
		</header>

		<form onsubmit={onSubmit} class="space-y-4">
			<div>
				<Label for="title">{t('company.jobs.field.title')}</Label>
				<Input id="title" bind:value={title} required />
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<Label for="company">{t('company.jobs.field.company')}</Label>
					<Input id="company" bind:value={company} required />
				</div>
				<div>
					<Label for="location">{t('company.jobs.field.location')}</Label>
					<Input id="location" bind:value={location} />
				</div>
			</div>

			<div>
				<Label for="description">{t('company.jobs.field.description')}</Label>
				<Textarea
					id="description"
					bind:value={description}
					required
					rows={8}
				/>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<Label for="salaryRange">{t('company.jobs.field.salaryRange')}</Label>
					<Input id="salaryRange" bind:value={salaryRange} />
				</div>
				<div>
					<Label for="applyUrl">{t('company.jobs.field.applyUrl')}</Label>
					<Input id="applyUrl" type="url" bind:value={applyUrl} />
				</div>
			</div>

			<div>
				<Label for="skills">{t('company.jobs.field.skills')}</Label>
				<Input id="skills" bind:value={skillsCsv} />
			</div>

			{#if serverError}
				<p role="alert" class="text-xs font-medium text-red-500/80">{serverError}</p>
			{/if}

			<div class="flex gap-2 pt-2">
				<Button type="submit" disabled={update.isPending}>
					{#if update.isPending}
						<Loader size={14} />
					{:else}
						{t('company.jobs.edit.submit')}
					{/if}
				</Button>
				<a href="/recruiting/jobs">
					<Button type="button" variant="ghost">
						{t('common.cancel')}
					</Button>
				</a>
			</div>
		</form>
	</div>
{/if}
