<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { createJobsCreate, getJobsGetMyJobsQueryKey } from 'api-client';
import type {
  CreateJobDto,
  CreateJobDtoJobType,
  CreateJobDtoRemotePolicy,
} from 'api-client';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-svelte';
import { Button, Input, Label } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

const DRAFT_KEY = 'patch:jobDraft';

type Draft = {
  title: string;
  company: string;
  location: string;
  description: string;
  jobType: CreateJobDtoJobType;
  remotePolicy: CreateJobDtoRemotePolicy;
  salaryRange: string;
  applyUrl: string;
  skillsCsv: string;
  requirementsCsv: string;
};

const EMPTY: Draft = {
  title: '',
  company: '',
  location: '',
  description: '',
  jobType: 'FULL_TIME',
  remotePolicy: 'REMOTE',
  salaryRange: '',
  applyUrl: '',
  skillsCsv: '',
  requirementsCsv: '',
};

let draft = $state<Draft>({ ...EMPTY });
let step = $state(1);
let serverError = $state('');

$effect(() => {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Draft>;
      draft = { ...EMPTY, ...parsed };
    }
  } catch {
    /* corrupt — ignore */
  }
});

$effect(() => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota — ignore */
  }
});

const steps = [
  { id: 1, label: 'Básico' },
  { id: 2, label: 'Detalhes' },
  { id: 3, label: 'Skills' },
  { id: 4, label: 'Salário' },
];

const canGoNext = $derived.by(() => {
  if (step === 1) return draft.title.trim() && draft.company.trim();
  if (step === 2) return draft.description.trim().length >= 20;
  return true;
});

const create = createJobsCreate(() => ({
  mutation: {
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: getJobsGetMyJobsQueryKey() });
      if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_KEY);
      goto('/recruiting/jobs');
    },
    onError(err: unknown) {
      serverError = err instanceof Error ? err.message : t('auth.shared.errorGeneric');
    },
  },
}));

function splitCsv(s: string): string[] {
  return s
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

async function submitDraft() {
  serverError = '';
  const body: CreateJobDto = {
    title: draft.title.trim(),
    company: draft.company.trim(),
    location: draft.location.trim() || undefined,
    description: draft.description.trim(),
    jobType: draft.jobType,
    remotePolicy: draft.remotePolicy,
    salaryRange: draft.salaryRange.trim() || undefined,
    applyUrl: draft.applyUrl.trim() || undefined,
    skills: splitCsv(draft.skillsCsv),
    requirements: splitCsv(draft.requirementsCsv),
  };
  await create.mutateAsync({ data: body });
}

function next() {
  if (step < 4) step += 1;
  else void submitDraft();
}

function back() {
  if (step > 1) step -= 1;
}
</script>

<svelte:head>
	<title>{t('company.jobs.new.pageTitle')}</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
	<header class="space-y-3">
		<h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
			{t('company.jobs.new.title')}
		</h1>
		<ol class="flex items-center gap-2 text-[11px] font-medium">
			{#each steps as s}
				{@const active = s.id === step}
				{@const done = s.id < step}
				<li class="flex items-center gap-2">
					<span class="flex h-5 w-5 items-center justify-center rounded-full border {active ? 'border-cyan-500 bg-cyan-500 text-white' : done ? 'border-cyan-500 bg-white text-cyan-600 dark:bg-neutral-900 dark:text-cyan-400' : 'border-gray-300 text-gray-400 dark:border-neutral-700 dark:text-neutral-600'}">
						{#if done}
							<Check size={10} />
						{:else}
							{s.id}
						{/if}
					</span>
					<span class="{active ? 'text-gray-800 dark:text-neutral-200' : 'text-gray-400 dark:text-neutral-600'}">
						{s.label}
					</span>
					{#if s.id < 4}
						<span class="h-px w-5 bg-gray-200 dark:bg-neutral-700"></span>
					{/if}
				</li>
			{/each}
		</ol>
	</header>

	<form onsubmit={(e) => { e.preventDefault(); next(); }} class="space-y-4">
		{#if step === 1}
			<div>
				<Label for="title">{t('company.jobs.field.title')}</Label>
				<Input id="title" bind:value={draft.title} required />
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<Label for="company">{t('company.jobs.field.company')}</Label>
					<Input id="company" bind:value={draft.company} required />
				</div>
				<div>
					<Label for="location">{t('company.jobs.field.location')}</Label>
					<Input id="location" bind:value={draft.location} />
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<Label for="jobType">{t('company.jobs.field.jobType')}</Label>
					<select id="jobType" bind:value={draft.jobType} class="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm">
						<option value="FULL_TIME">Full-time</option>
						<option value="PART_TIME">Part-time</option>
						<option value="CONTRACT">Contract</option>
						<option value="INTERNSHIP">Internship</option>
						<option value="FREELANCE">Freelance</option>
					</select>
				</div>
				<div>
					<Label for="remotePolicy">{t('company.jobs.field.remotePolicy')}</Label>
					<select id="remotePolicy" bind:value={draft.remotePolicy} class="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm">
						<option value="REMOTE">Remote</option>
						<option value="HYBRID">Hybrid</option>
						<option value="ONSITE">On-site</option>
					</select>
				</div>
			</div>
		{:else if step === 2}
			<div>
				<Label for="description">{t('company.jobs.field.description')}</Label>
				<textarea
					id="description"
					bind:value={draft.description}
					rows="10"
					class="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
				></textarea>
				<p class="mt-1 text-[11px] text-gray-500 dark:text-neutral-500">
					{draft.description.trim().length} caracteres — mínimo 20.
				</p>
			</div>
			<div>
				<Label for="requirements">Requisitos</Label>
				<Input id="requirements" bind:value={draft.requirementsCsv} placeholder="3+ anos com React, inglês intermediário" />
				<p class="text-[11px] text-gray-500 dark:text-neutral-500">Separe por vírgula.</p>
			</div>
		{:else if step === 3}
			<div>
				<Label for="skills">{t('company.jobs.field.skills')}</Label>
				<Input id="skills" bind:value={draft.skillsCsv} placeholder="react, typescript, postgres" />
				<p class="text-[11px] text-gray-500 dark:text-neutral-500">Separe por vírgula. Esses skills viram filtros pro candidato.</p>
			</div>
			{#if splitCsv(draft.skillsCsv).length > 0}
				<div class="flex flex-wrap gap-1.5">
					{#each splitCsv(draft.skillsCsv) as skill}
						<span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-neutral-700 dark:text-neutral-300">{skill}</span>
					{/each}
				</div>
			{/if}
		{:else if step === 4}
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<Label for="salaryRange">{t('company.jobs.field.salaryRange')}</Label>
					<Input id="salaryRange" bind:value={draft.salaryRange} placeholder="R$ 8k - 12k" />
				</div>
				<div>
					<Label for="applyUrl">{t('company.jobs.field.applyUrl')}</Label>
					<Input id="applyUrl" type="url" bind:value={draft.applyUrl} placeholder="https://empresa.com/vagas/..." />
				</div>
			</div>
		{/if}

		{#if serverError}
			<p role="alert" class="text-xs font-medium text-red-500/80">{serverError}</p>
		{/if}

		<div class="flex items-center justify-between pt-2">
			<Button type="button" variant="ghost" onclick={back} disabled={step === 1}>
				<ArrowLeft size={14} />
				Voltar
			</Button>
			<div class="flex gap-2">
				<a href="/recruiting/jobs">
					<Button type="button" variant="ghost">{t('common.cancel')}</Button>
				</a>
				<Button type="submit" disabled={!canGoNext || create.isPending}>
					{#if create.isPending}
						<Loader2 size={14} class="animate-spin" />
					{:else if step === 4}
						{t('company.jobs.new.submit')}
					{:else}
						Avançar
						<ArrowRight size={14} />
					{/if}
				</Button>
			</div>
		</div>
	</form>
</div>
