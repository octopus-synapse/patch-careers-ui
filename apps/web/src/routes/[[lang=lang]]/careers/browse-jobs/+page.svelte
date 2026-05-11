<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import {
  postV1AutomationRageApply,
  createGetV1Jobs,
  createGetV1JobsRecommended,
  createGetV1JobsWithFitScore,
  postV1Jobs,
  getV1JobsQueryKey,
} from 'api-client';
import type { CreateJobRequest, CreateJobRequestJobTypeEnumKey, GetV1JobsRecommended200, GetV1JobsWithFitScore200 } from 'api-client';
import { formatDate } from 'i18n';
import { ArrowRight, Bookmark, Globe2, Plus, Sparkles, Zap } from 'lucide-svelte';
import { Badge, Button, FitScoreChip, FormModal, Input, Label, Loader, MatchBadge, Modal, Tabs, Textarea, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { DataTable } from 'ui';
import { Pagination } from 'ui';
import { SearchFilterBar } from 'ui';
import NewJobsBadge from '$lib/components/jobs/new-jobs-badge.svelte';
import { isUsdEurJob } from '$lib/utils/is-usd-eur';
import { locale } from '$lib/state/locale.svelte';

type FitScoreItem = GetV1JobsWithFitScore200['items'][number];
type FitScoreDetail = NonNullable<FitScoreItem['fitScore']>;
type RecommendedJob = GetV1JobsRecommended200['items'][number];
// Display row: a recommended job optionally enriched with the fit-score side-channel.
type DisplayJob = RecommendedJob & { fitScore?: FitScoreDetail };

const t = $derived(locale.t);
const queryClient = useQueryClient();

let page = $state(1);
let search = $state('');
let jobTypeFilter = $state('');
let activeTab = $state<'recommended' | 'all'>('recommended');
let usdEurOnly = $state(false);

// Reflect ?remote=usd in URL so the filter is shareable and survives reloads.
$effect(() => {
  if (!browser) return;
  usdEurOnly = new URL(window.location.href).searchParams.get('remote') === 'usd';
});

function toggleUsdEur() {
  usdEurOnly = !usdEurOnly;
  page = 1;
  if (browser) {
    const url = new URL(window.location.href);
    if (usdEurOnly) url.searchParams.set('remote', 'usd');
    else url.searchParams.delete('remote');
    window.history.replaceState({}, '', url.toString());
  }
}

const tabs = $derived([
  { value: 'recommended', label: t('jobs.tabRecommended') },
  { value: 'all', label: t('jobs.tabAll') },
]);

// svelte-ignore state_referenced_locally
const jobsQuery = createGetV1Jobs(
  {
    page,
    limit: 20,
    search: search || '',
    skills: '',
    ...(usdEurOnly ? { paymentCurrency: 'USD,EUR' } : {}),
  },
  { query: { enabled: () => browser && activeTab === 'all'} },
);

// svelte-ignore state_referenced_locally
const recommendedQuery = createGetV1JobsRecommended(
  { page, limit: 20 },
  { query: { enabled: () => browser && activeTab === 'recommended'} },
);

const jobsData = $derived($jobsQuery.data);
const recommendedData = $derived($recommendedQuery.data);

// Side-channel: pull structured fit scores for the current page of jobs.
// Backend canonical response merges the breakdown into each item; we mirror it
// so the chip can expand into matched / missing skills on hover.
// svelte-ignore state_referenced_locally
const fitScoreQuery = createGetV1JobsWithFitScore(
  {
    page,
    limit: 20,
    ...(search ? { search } : {}),
    ...(usdEurOnly ? { paymentCurrency: 'USD,EUR' } : {}),
  },
  { query: { enabled: () => browser && activeTab === 'all'} },
);
const fitScoreById = $derived.by(() => {
  const map: Record<string, FitScoreDetail> = {};
  if (!$fitScoreQuery.data) return map;
  for (const item of $fitScoreQuery.data.items) {
    if (item.fitScore) map[item.id] = item.fitScore;
  }
  return map;
});

const allList = $derived<DisplayJob[] | undefined>(
  jobsData?.items.map((j) => {
    const fit = fitScoreById[j.id];
    return { ...j, matchScore: fit?.score ?? 0, fitScore: fit };
  }),
);
const recommendedList = $derived(recommendedData?.items);
const jobsList = $derived<DisplayJob[] | undefined>(
  activeTab === 'recommended' ? recommendedList : allList,
);
const filteredJobs = $derived.by(() => {
  let list = jobsList;
  if (!list) return list;
  if (jobTypeFilter) list = list.filter((j) => j.jobType === jobTypeFilter);
  // "all" tab: server already filters via `paymentCurrency`. "recommended"
  // endpoint doesn't accept it yet, so we fall back to a display helper.
  if (usdEurOnly && activeTab === 'recommended') {
    const nullToUndef = (v: string | null) => (v === null ? undefined : v);
    list = list.filter((j) =>
      isUsdEurJob({
        salaryRange: nullToUndef(j.salaryRange),
        paymentCurrency: nullToUndef(j.paymentCurrency),
        location: nullToUndef(j.location),
        jobType: j.jobType,
      }),
    );
  }
  return list;
});
const pagination = $derived.by(() => {
  if (activeTab === 'recommended') {
    return recommendedData
      ? { page: recommendedData.page, totalPages: recommendedData.totalPages }
      : undefined;
  }
  return jobsData ? { page: jobsData.page, totalPages: jobsData.totalPages } : undefined;
});

function handleTabChange(value: string) {
  activeTab = value as typeof activeTab;
  page = 1;
}

// Create modal
let createModal = $state(false);
let createLoading = $state(false);
let formTitle = $state('');
let formCompany = $state('');
let formLocation = $state('');
let formJobType = $state('Full-time');
let formDescription = $state('');
let formRequirements = $state('');
let formSkills = $state('');
let formSalaryRange = $state('');
let formApplyUrl = $state('');

const jobTypes = ['Internship', 'Contract', 'Full-time', 'Part-time', 'Volunteer', 'Freelance'];

function resetForm() {
  formTitle = '';
  formCompany = '';
  formLocation = '';
  formJobType = 'Full-time';
  formDescription = '';
  formRequirements = '';
  formSkills = '';
  formSalaryRange = '';
  formApplyUrl = '';
}

async function handleCreate() {
  createLoading = true;
  try {
    const data: CreateJobRequest = {
      title: formTitle,
      company: formCompany,
      location: formLocation || undefined,
      jobType: formJobType as CreateJobRequestJobTypeEnumKey,
      description: formDescription,
      requirements: formRequirements
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
      skills: formSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      salaryRange: formSalaryRange || undefined,
      applyUrl: formApplyUrl || undefined,
    };
    await postV1Jobs(data);
    queryClient.invalidateQueries({ queryKey: getV1JobsQueryKey() });
    createModal = false;
    resetForm();
  } finally {
    createLoading = false;
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('feed.justNow');
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return formatDate(dateStr, locale.current);
}

const columns = $derived([
  { key: 'title', label: t('jobs.title') },
  { key: 'company', label: t('jobs.company') },
  { key: 'jobType', label: t('jobs.type'), width: '120px' },
  { key: 'skills', label: t('jobs.skills') },
  { key: 'createdAt', label: 'Posted', width: '100px' },
]);

const filters = $derived([
  {
    key: 'jobType',
    label: t('jobs.type'),
    options: jobTypes.map((jt) => ({ value: jt, label: jt })),
    value: jobTypeFilter,
  },
]);

// Rage apply — bulk-submit AI-tailored applications to every match >= minFit.
// Numbers stored as strings to keep <Input type="number"> happy; coerced when
// we send the request.
let rageOpen = $state(false);
let rageRunning = $state(false);
let rageMinFit = $state('80');
let rageMax = $state('20');
let rageFailures = $state<Array<{ jobId: string; reason: string }>>([]);
let rageShowFailures = $state(false);

async function runRageApply() {
  if (rageRunning) return; // dedupe rapid double-clicks
  rageRunning = true;
  rageFailures = [];
  try {
    const res = await postV1AutomationRageApply({
      minFit: Number.parseInt(rageMinFit, 10) || 80,
      maxApplications: Number.parseInt(rageMax, 10) || 20,
    });
    rageFailures = res.failed;
    const failedCount = rageFailures.length;
    const summary = `Rage apply: ${res.submitted}/${res.attempted} enviadas, ${res.skippedExisting} já existiam${failedCount ? `, ${failedCount} falharam` : ''}.`;
    toastState.show(summary, failedCount > 0 ? 'info' : 'success');
    if (failedCount === 0) {
      rageOpen = false;
    }
  } catch (err) {
    handleApiError(err);
  } finally {
    rageRunning = false;
  }
}
</script>

<svelte:head>
	<title>{t('jobs.pageTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-5xl px-3 sm:px-6">
		<div class="space-y-6">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-3">
					<h1 class="text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
						{t('jobs.pageTitle')}
					</h1>
					<NewJobsBadge jobs={jobsList} />
				</div>
				<div class="flex items-center gap-2">
					<Button variant="ghost" size="sm" onclick={() => goto('/careers/browse-jobs/saved')}>
						<Bookmark size={14} />
						{t('jobs.savedNav')}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={() => (rageOpen = true)}
						aria-label="Rage apply"
					>
						<Zap size={14} />
						Rage apply
					</Button>
					<Button variant="solid" size="sm" onclick={() => createModal = true}>
						<Plus size={14} />
						{t('jobs.postJob')}
					</Button>
				</div>
			</div>

			<a
				href="/careers/apply-modes"
				class="group flex items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 via-sky-500/5 to-violet-500/5 px-4 py-3 transition-all hover:border-cyan-500/60 hover:shadow-sm dark:border-cyan-500/20"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
						<Sparkles size={14} class="text-cyan-600 dark:text-cyan-400" />
					</div>
					<div>
						<p class="text-xs font-semibold text-gray-800 dark:text-neutral-200">
							{t('applyModes.heroTitle')}
						</p>
						<p class="text-[11px] text-gray-500 dark:text-neutral-500">
							{t('applyModes.heroSubtitle')}
						</p>
					</div>
				</div>
				<ArrowRight
					size={14}
					class="shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-neutral-500"
				/>
			</a>

			<div class="flex flex-wrap items-center justify-between gap-3">
				<Tabs {tabs} selected={activeTab} onchange={handleTabChange} />

				<button
					type="button"
					onclick={toggleUsdEur}
					aria-pressed={usdEurOnly}
					class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {usdEurOnly
						? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
						: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:border-neutral-600'}"
				>
					<Globe2 size={13} />
					{t('jobs.remoteUsd.filterToggle')}
				</button>
			</div>

			{#if activeTab === 'all'}
				<SearchFilterBar
					{search}
					{filters}
					placeholder={t('jobs.search')}
					onsearch={(v) => { search = v; page = 1; }}
					onfilterchange={(key, value) => { if (key === 'jobType') jobTypeFilter = value; page = 1; }}
				/>
			{/if}

			{#if activeTab === 'recommended' && !$recommendedQuery.isLoading && (!recommendedList || recommendedList.length === 0)}
				<div class="rounded-xl border p-6 text-center text-sm text-gray-500 dark:text-neutral-500 dark:border-neutral-800">
					{t('jobs.noRecommended')}
				</div>
			{:else if filteredJobs}
				<DataTable
					{columns}
					data={filteredJobs}
					loading={activeTab === 'recommended' ? $recommendedQuery.isLoading : $jobsQuery.isLoading}
					emptyMessage={t('jobs.noJobs')}
					onrowclick={(row) => goto(`/careers/browse-jobs/${row.id}`)}
				>
					{#snippet cell({ row, key })}
						{#if key === 'title'}
							<div class="flex items-center gap-2">
								<span class="font-medium">{row.title ?? '---'}</span>
								{#if row.fitScore}
									<FitScoreChip
										score={row.fitScore.score}
										matchedSkills={row.fitScore.breakdown.matchedSkills}
										missingSkills={row.fitScore.breakdown.missingSkills}
										englishMatch={row.fitScore.breakdown.englishMatch}
										remoteMatch={row.fitScore.breakdown.remoteMatch}
										labels={{
											match: t('jobs.matchLabel'),
											title: t('jobs.fit.chipTitle'),
											matchedHeader: t('jobs.fit.matchedTitle'),
											missingHeader: t('jobs.fit.missingTitle'),
											englishLabel: t('jobs.fit.englishLabel'),
											remoteLabel: t('jobs.fit.remoteLabel'),
											englishOk: t('jobs.fit.englishOk'),
											englishBelow: t('jobs.fit.englishBelow'),
											englishUnknown: t('jobs.fit.englishUnknown'),
											remoteExact: t('jobs.fit.remoteExact'),
											remotePartial: t('jobs.fit.remotePartial'),
											remoteMismatch: t('jobs.fit.remoteMismatch'),
											none: t('jobs.fit.none'),
										}}
									/>
								{:else if typeof row.matchScore === 'number'}
									<MatchBadge score={row.matchScore} label={t('jobs.matchLabel')} />
								{/if}
							</div>
						{:else if key === 'company'}
							{row.company}
						{:else if key === 'jobType'}
							{row.jobType}
						{:else if key === 'skills'}
							{@const skills = row.skills}
							{#if skills.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each skills.slice(0, 3) as skill}
										<Badge intent="neutral" size="md">{skill}</Badge>
									{/each}
									{#if skills.length > 3}
										<span class="text-[10px] text-gray-500 dark:text-neutral-500">+{skills.length - 3}</span>
									{/if}
								</div>
							{/if}
						{:else if key === 'createdAt'}
							<span class="text-xs text-gray-500 dark:text-neutral-500">{timeAgo(row.createdAt)}</span>
						{:else}
							---
						{/if}
					{/snippet}
				</DataTable>
			{/if}

			{#if pagination && pagination.totalPages > 1}
				<div class="flex justify-center">
					<Pagination
						page={pagination.page}
						totalPages={pagination.totalPages}
						onpagechange={(p) => page = p}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Create Job Modal -->
<FormModal
	open={createModal}
	title={t('jobs.postJob')}
	loading={createLoading}
	onSubmit={handleCreate}
	onClose={() => { createModal = false; resetForm(); }}
>
	<div class="space-y-3">
		<div>
			<Label>{t('jobs.title')} *</Label>
			<Input bind:value={formTitle} placeholder="Software Engineer" required />
		</div>
		<div>
			<Label>{t('jobs.company')} *</Label>
			<Input bind:value={formCompany} placeholder="Acme Inc." required />
		</div>
		<div>
			<Label>{t('jobs.location')}</Label>
			<Input bind:value={formLocation} placeholder="Remote / San Francisco, CA" />
		</div>
		<div>
			<Label>{t('jobs.type')} *</Label>
			<select
				bind:value={formJobType}
				class="w-full rounded-lg border px-3 py-1.5 text-sm outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
			>
				{#each jobTypes as jt}
					<option value={jt}>{jt}</option>
				{/each}
			</select>
		</div>
		<div>
			<Label>{t('jobs.description')} *</Label>
			<Textarea
				bind:value={formDescription}
				placeholder="Job description..."
				required
				rows={4}
			/>
		</div>
		<div>
			<Label>{t('jobs.requirements')}</Label>
			<Input bind:value={formRequirements} placeholder="React, TypeScript, 3+ years..." />
			<span class="text-[10px] text-gray-500 dark:text-neutral-500">Comma-separated</span>
		</div>
		<div>
			<Label>{t('jobs.skills')}</Label>
			<Input bind:value={formSkills} placeholder="React, Node.js, PostgreSQL..." />
			<span class="text-[10px] text-gray-500 dark:text-neutral-500">Comma-separated</span>
		</div>
		<div>
			<Label>{t('jobs.salary')}</Label>
			<Input bind:value={formSalaryRange} placeholder="$80k - $120k" />
		</div>
		<div>
			<Label>{t('jobs.applyUrl')}</Label>
			<Input bind:value={formApplyUrl} placeholder="https://example.com/apply" type="url" />
		</div>
	</div>
</FormModal>

{#if rageOpen}
	<Modal open={rageOpen} onClose={() => (rageOpen = false)}>
		{#snippet title()}Rage apply{/snippet}
		<p class="mb-4 text-sm text-gray-500 dark:text-neutral-500">
			Vamos aplicar (com CV adaptado por IA) a TODAS as vagas com fit &ge; {rageMinFit}, até {rageMax}
			aplicações. Sem volta.
		</p>
		<div class="space-y-3">
			<div>
				<Label for="min-fit">Fit mínimo</Label>
				<Input id="min-fit" type="number" bind:value={rageMinFit} />
			</div>
			<div>
				<Label for="max-apps">Máximo de aplicações</Label>
				<Input id="max-apps" type="number" bind:value={rageMax} />
			</div>
			{#if rageRunning}
				<p class="flex items-center gap-2 text-xs text-gray-500" role="status">
					<Loader size={12} /> Adaptando CV e enviando...
				</p>
			{/if}
			{#if rageFailures.length > 0}
				<div class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950">
					<button
						type="button"
						class="flex w-full items-center justify-between font-medium text-amber-800 dark:text-amber-200"
						onclick={() => (rageShowFailures = !rageShowFailures)}
					>
						<span>{rageFailures.length} falharam</span>
						<span aria-hidden="true">{rageShowFailures ? '▾' : '▸'}</span>
					</button>
					{#if rageShowFailures}
						<ul class="mt-2 space-y-1 text-amber-700 dark:text-amber-300">
							{#each rageFailures as f (f.jobId)}
								<li class="font-mono">
									<span class="opacity-70">{f.jobId}:</span> {f.reason}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>
		<div class="mt-5 flex justify-end gap-2">
			<Button variant="outline" size="sm" onclick={() => (rageOpen = false)} disabled={rageRunning}>
				Cancelar
			</Button>
			<Button variant="solid" size="sm" onclick={runRageApply} disabled={rageRunning}>
				{rageRunning ? 'Aplicando...' : 'Rodar agora'}
			</Button>
		</div>
	</Modal>
{/if}
