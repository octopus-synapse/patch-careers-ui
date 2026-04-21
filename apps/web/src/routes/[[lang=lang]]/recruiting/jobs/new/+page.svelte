<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { createJobsCreate, getJobsGetMyJobsQueryKey } from 'api-client';
import type {
  CreateJobDto,
  CreateJobDtoJobType,
  CreateJobDtoRemotePolicy,
} from 'api-client';
import { Loader2 } from 'lucide-svelte';
import { Button, Input, Label } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

let title = $state('');
let company = $state('');
let location = $state('');
let description = $state('');
let jobType = $state<CreateJobDtoJobType>('FULL_TIME');
let remotePolicy = $state<CreateJobDtoRemotePolicy>('REMOTE');
let salaryRange = $state('');
let applyUrl = $state('');
let skillsCsv = $state('');
let serverError = $state('');

const create = createJobsCreate(() => ({
  mutation: {
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: getJobsGetMyJobsQueryKey() });
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
  const body: CreateJobDto = {
    title: title.trim(),
    company: company.trim(),
    location: location.trim() || undefined,
    description: description.trim(),
    jobType,
    remotePolicy,
    salaryRange: salaryRange.trim() || undefined,
    applyUrl: applyUrl.trim() || undefined,
    skills: skillsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
  await create.mutateAsync({ data: body });
}
</script>

<svelte:head>
	<title>{t('company.jobs.new.pageTitle')}</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
	<header>
		<h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
			{t('company.jobs.new.title')}
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

		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<Label for="jobType">{t('company.jobs.field.jobType')}</Label>
				<select id="jobType" bind:value={jobType} class="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm">
					<option value="FULL_TIME">Full-time</option>
					<option value="PART_TIME">Part-time</option>
					<option value="CONTRACT">Contract</option>
					<option value="INTERNSHIP">Internship</option>
					<option value="FREELANCE">Freelance</option>
				</select>
			</div>
			<div>
				<Label for="remotePolicy">{t('company.jobs.field.remotePolicy')}</Label>
				<select id="remotePolicy" bind:value={remotePolicy} class="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm">
					<option value="REMOTE">Remote</option>
					<option value="HYBRID">Hybrid</option>
					<option value="ONSITE">On-site</option>
				</select>
			</div>
		</div>

		<div>
			<Label for="description">{t('company.jobs.field.description')}</Label>
			<textarea
				id="description"
				bind:value={description}
				required
				rows="8"
				class="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
			></textarea>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<Label for="salaryRange">{t('company.jobs.field.salaryRange')}</Label>
				<Input id="salaryRange" bind:value={salaryRange} placeholder="R$ 8k - 12k" />
			</div>
			<div>
				<Label for="applyUrl">{t('company.jobs.field.applyUrl')}</Label>
				<Input id="applyUrl" type="url" bind:value={applyUrl} />
			</div>
		</div>

		<div>
			<Label for="skills">{t('company.jobs.field.skills')}</Label>
			<Input id="skills" bind:value={skillsCsv} placeholder="react, typescript, postgres" />
		</div>

		{#if serverError}
			<p role="alert" class="text-xs font-medium text-red-500/80">{serverError}</p>
		{/if}

		<div class="flex gap-2 pt-2">
			<Button type="submit" disabled={create.isPending}>
				{#if create.isPending}
					<Loader2 size={14} class="animate-spin" />
				{:else}
					{t('company.jobs.new.submit')}
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
