<script lang="ts">
	import {
		createJobsFindAll,
		jobsCreate,
		getJobsFindAllQueryKey,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Button, Input, Label, Textarea, FormModal } from 'ui';
	import { Plus } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import SearchFilterBar from '$lib/components/admin/search-filter-bar.svelte';
	import Pagination from '$lib/components/admin/pagination.svelte';

	interface JobItem {
		id: string;
		title?: string;
		company?: string;
		jobType?: string;
		skills?: string[];
		createdAt: string;
		[key: string]: unknown;
	}

	interface JobsResponse {
		jobs: JobItem[];
		pagination: { page: number; totalPages: number };
	}

	const t = $derived(locale.t);
	const queryClient = useQueryClient();

	let page = $state(1);
	let search = $state('');
	let jobTypeFilter = $state('');

	const jobsQuery = createJobsFindAll(
		() => ({
			page,
			limit: 20,
			search: search || '',
			skills: '',
		}),
		() => ({ query: { enabled: browser } })
	);

	const jobsData = $derived(jobsQuery.data as unknown as JobsResponse | undefined);
	const jobsList = $derived(jobsData?.jobs);
	const filteredJobs = $derived(
		jobTypeFilter ? jobsList?.filter((j: JobItem) => j.jobType === jobTypeFilter) : jobsList
	);
	const pagination = $derived(jobsData?.pagination);

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
				requirements: formRequirements.split(',').map(r => r.trim()).filter(Boolean),
				skills: formSkills.split(',').map(s => s.trim()).filter(Boolean),
				salaryRange: formSalaryRange || undefined,
				applyUrl: formApplyUrl || undefined,
			};
			await jobsCreate({ body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
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
		return new Date(dateStr).toLocaleDateString();
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
			options: jobTypes.map(jt => ({ value: jt, label: jt })),
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
				<Button variant="solid" size="sm" onclick={() => createModal = true}>
					<Plus size={14} />
					{t('jobs.postJob')}
				</Button>
			</div>

			<SearchFilterBar
				{search}
				{filters}
				placeholder={t('jobs.search')}
				onsearch={(v) => { search = v; page = 1; }}
				onfilterchange={(key, value) => { if (key === 'jobType') jobTypeFilter = value; page = 1; }}
			/>

			{#if filteredJobs}
				<DataTable
					{columns}
					data={filteredJobs}
					loading={jobsQuery.isLoading}
					emptyMessage={t('jobs.noJobs')}
					onrowclick={(row) => goto(`/jobs/${row.id}`)}
				>
					{#snippet cell({ row, key })}
						{#if key === 'title'}
							<span class="font-medium">{row.title ?? '---'}</span>
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
