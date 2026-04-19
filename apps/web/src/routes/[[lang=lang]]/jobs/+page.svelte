<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createJobsFindAll,
  createJobsGetRecommendedJobs,
  getJobsFindAllQueryKey,
  jobsCreate,
} from 'api-client';
import { formatDate } from 'i18n';
import { ArrowRight, Bookmark, Globe2, Plus, Sparkles } from 'lucide-svelte';
import { Button, FormModal, Input, Label, MatchBadge, Tabs, Textarea } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import DataTable from '$lib/components/admin/data-table.svelte';
import Pagination from '$lib/components/admin/pagination.svelte';
import SearchFilterBar from '$lib/components/admin/search-filter-bar.svelte';
import { isUsdEurJob } from '$lib/jobs/is-usd-eur';
import { locale } from '$lib/locale.svelte';

interface JobItem {
  id: string;
  title?: string;
  company?: string;
  jobType?: string;
  skills?: string[];
  createdAt: string;
  matchScore?: number;
  salaryRange?: string;
  paymentCurrency?: string;
  location?: string;
  [key: string]: unknown;
}

interface JobsResponse {
  items: JobItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

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

const jobsQuery = createJobsFindAll(
  () => ({
    page,
    limit: 20,
    search: search || '',
    skills: '',
    ...(usdEurOnly ? { paymentCurrency: 'USD,EUR' } : {}),
  }),
  () => ({ query: { enabled: browser && activeTab === 'all' } }),
);

const recommendedQuery = createJobsGetRecommendedJobs(
  () => ({ page, limit: 20 }),
  () => ({ query: { enabled: browser && activeTab === 'recommended' } }),
);

type RecommendedResponse = {
  data?: JobItem[];
  page?: number;
  totalPages?: number;
  total?: number;
};

const jobsData = $derived(jobsQuery.data as unknown as JobsResponse | undefined);
const recommendedData = $derived(
  recommendedQuery.data as unknown as RecommendedResponse | undefined,
);
const allList = $derived(jobsData?.items);
const recommendedList = $derived(recommendedData?.data);
const jobsList = $derived(activeTab === 'recommended' ? recommendedList : allList);
const filteredJobs = $derived.by(() => {
  let list = jobsList;
  if (!list) return list;
  if (jobTypeFilter) list = list.filter((j: JobItem) => j.jobType === jobTypeFilter);
  // "all" tab: server already filters via `paymentCurrency`. "recommended"
  // endpoint doesn't accept it yet, so we fall back to a display helper.
  if (usdEurOnly && activeTab === 'recommended') {
    list = list.filter((j: JobItem) => isUsdEurJob(j));
  }
  return list;
});
const pagination = $derived.by(() => {
  if (activeTab === 'recommended') {
    return recommendedData
      ? { page: recommendedData.page ?? 1, totalPages: recommendedData.totalPages ?? 0 }
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
    const data = {
      title: formTitle,
      company: formCompany,
      location: formLocation,
      jobType: formJobType,
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
    await jobsCreate({
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    queryClient.invalidateQueries({ queryKey: getJobsFindAllQueryKey() });
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
</script>

<svelte:head>
	<title>{t('jobs.pageTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-5xl px-3 sm:px-6">
		<div class="space-y-6">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h1 class="text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
					{t('jobs.pageTitle')}
				</h1>
				<div class="flex items-center gap-2">
					<Button variant="ghost" size="sm" onclick={() => goto('/jobs/saved')}>
						<Bookmark size={14} />
						{t('jobs.savedNav')}
					</Button>
					<Button variant="solid" size="sm" onclick={() => createModal = true}>
						<Plus size={14} />
						{t('jobs.postJob')}
					</Button>
				</div>
			</div>

			<a
				href="/apply-modes"
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

			{#if activeTab === 'recommended' && !recommendedQuery.isLoading && (!recommendedList || recommendedList.length === 0)}
				<div class="rounded-xl border p-6 text-center text-sm text-gray-500 dark:text-neutral-500 dark:border-neutral-800">
					{t('jobs.noRecommended')}
				</div>
			{:else if filteredJobs}
				<DataTable
					{columns}
					data={filteredJobs}
					loading={activeTab === 'recommended' ? recommendedQuery.isLoading : jobsQuery.isLoading}
					emptyMessage={t('jobs.noJobs')}
					onrowclick={(row) => goto(`/jobs/${row.id}`)}
				>
					{#snippet cell({ row, key })}
						{#if key === 'title'}
							<div class="flex items-center gap-2">
								<span class="font-medium">{row.title ?? '---'}</span>
								{#if typeof row.matchScore === 'number'}
									<MatchBadge score={row.matchScore} label={t('jobs.matchLabel')} />
								{/if}
							</div>
						{:else if key === 'company'}
							{row.company ?? '---'}
						{:else if key === 'jobType'}
							{row.jobType ?? '---'}
						{:else if key === 'skills'}
							{@const skills = row.skills}
							{#if skills}
								<div class="flex flex-wrap gap-1">
									{#each skills.slice(0, 3) as skill}
										<span class="rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300">{skill}</span>
									{/each}
									{#if skills.length > 3}
										<span class="text-[10px] text-gray-500 dark:text-neutral-500">+{skills.length - 3}</span>
									{/if}
								</div>
							{/if}
						{:else if key === 'createdAt'}
							<span class="text-xs text-gray-500 dark:text-neutral-500">{timeAgo(row.createdAt)}</span>
						{:else}
							{row[key] ?? '---'}
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
