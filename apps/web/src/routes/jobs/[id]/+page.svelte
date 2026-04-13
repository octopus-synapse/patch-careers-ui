<script lang="ts">
	import {
		createJobsFindById,
		createAuthSession,
		jobsUpdate,
		jobsDelete,
		getJobsFindAllQueryKey,
		getJobsFindByIdQueryKey,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Button, Input } from 'ui';
	import { ArrowLeft, ExternalLink, Pencil, Trash2, MapPin, Building2, Briefcase, DollarSign } from 'lucide-svelte';
	import { Loader2 } from 'lucide-svelte';
	import FormModal from '$lib/components/admin/form-modal.svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';

	interface Job {
		id: string;
		title?: string;
		company?: string;
		location?: string;
		jobType?: string;
		description?: string;
		requirements?: string[];
		skills?: string[];
		salaryRange?: string;
		applyUrl?: string;
		userId?: string;
		createdBy?: string;
		createdAt?: string;
	}

	const t = $derived(locale.t);
	const queryClient = useQueryClient();

	const jobId = $derived(($page.params as Record<string, string>).id);

	const auth = createAuthSession(() => ({ query: { retry: false, enabled: browser } }));
	const currentUserId = $derived(
		String(auth.data?.user?.id ?? '')
	);

	const jobQuery = createJobsFindById(
		() => jobId,
		() => ({ query: { enabled: browser && !!jobId } })
	);

	const job = $derived(jobQuery.data as unknown as Job | undefined);
	const isOwner = $derived(
		!!currentUserId && !!job && (job.userId === currentUserId || job.createdBy === currentUserId)
	);

	// Edit modal
	let editModal = $state(false);
	let editLoading = $state(false);
	let formTitle = $state('');
	let formCompany = $state('');
	let formLocation = $state('');
	let formJobType = $state('Full-time');
	let formDescription = $state('');
	let formRequirements = $state('');
	let formSkills = $state('');
	let formSalaryRange = $state('');
	let formApplyUrl = $state('');

	// Delete modal
	let deleteConfirm = $state(false);
	let deleteLoading = $state(false);

	const jobTypes = ['Internship', 'Contract', 'Full-time', 'Part-time', 'Volunteer', 'Freelance'];

	function openEdit() {
		if (!job) return;
		formTitle = job.title ?? '';
		formCompany = job.company ?? '';
		formLocation = job.location ?? '';
		formJobType = job.jobType ?? 'Full-time';
		formDescription = job.description ?? '';
		formRequirements = job.requirements?.join(', ') ?? '';
		formSkills = job.skills?.join(', ') ?? '';
		formSalaryRange = job.salaryRange ?? '';
		formApplyUrl = job.applyUrl ?? '';
		editModal = true;
	}

	async function handleEdit() {
		editLoading = true;
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
			await jobsUpdate(jobId, { body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
			queryClient.invalidateQueries({ queryKey: getJobsFindByIdQueryKey(jobId) });
			queryClient.invalidateQueries({ queryKey: getJobsFindAllQueryKey() });
			editModal = false;
		} finally {
			editLoading = false;
		}
	}

	async function handleDelete() {
		deleteLoading = true;
		try {
			await jobsDelete(jobId);
			queryClient.invalidateQueries({ queryKey: getJobsFindAllQueryKey() });
			goto('/jobs');
		} finally {
			deleteLoading = false;
			deleteConfirm = false;
		}
	}
</script>

<svelte:head>
	<title>{job?.title ?? t('jobs.pageTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-3xl px-6">
		<a href="/jobs" class="mb-6 inline-flex items-center gap-1.5 text-xs font-medium transition-colors text-gray-500 dark:text-neutral-500 hover:text-gray-800 dark:hover:text-neutral-200">
			<ArrowLeft size={14} />
			{t('common.back')}
		</a>

		{#if jobQuery.isLoading}
			<div class="flex items-center justify-center py-20">
				<Loader2 size={20} class="animate-spin text-gray-500 dark:text-neutral-500" />
			</div>
		{:else if !job}
			<div class="py-20 text-center">
				<p class="text-sm text-gray-500 dark:text-neutral-500">Job not found</p>
			</div>
		{:else}
			<div class="space-y-6">
				<!-- Job header card -->
				<div class="rounded-xl border border-gray-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-6">
					<div class="flex items-start justify-between">
						<div class="space-y-2">
							<h1 class="text-2xl font-bold tracking-tight text-gray-800 dark:text-neutral-200">{job.title}</h1>
							<div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-neutral-500">
								{#if job.company}
									<span class="flex items-center gap-1">
										<Building2 size={14} />
										{job.company}
									</span>
								{/if}
								{#if job.location}
									<span class="flex items-center gap-1">
										<MapPin size={14} />
										{job.location}
									</span>
								{/if}
								{#if job.jobType}
									<span class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
										<Briefcase size={12} class="mr-1 inline" />
										{job.jobType}
									</span>
								{/if}
								{#if job.salaryRange}
									<span class="flex items-center gap-1">
										<DollarSign size={14} />
										{job.salaryRange}
									</span>
								{/if}
							</div>
						</div>
						{#if isOwner}
							<div class="flex items-center gap-2">
								<Button variant="outline" size="sm" onclick={openEdit}>
									<Pencil size={14} />
									{t('jobs.edit')}
								</Button>
								<Button variant="danger" size="sm" onclick={() => deleteConfirm = true}>
									<Trash2 size={14} />
									{t('jobs.delete')}
								</Button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Description -->
				{#if job.description}
					<div class="rounded-xl border border-gray-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-6">
						<h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
							{t('jobs.description')}
						</h2>
						<div class="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-neutral-200">{job.description}</div>
					</div>
				{/if}

				<!-- Requirements -->
				{#if job.requirements?.length}
				{@const requirements = job.requirements}
					<div class="rounded-xl border border-gray-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-6">
						<h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
							{t('jobs.requirements')}
						</h2>
						<ul class="list-disc space-y-1.5 pl-5 text-sm text-gray-800 dark:text-neutral-200">
							{#each requirements as req}
								<li>{req}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Skills -->
				{#if job.skills?.length}
				{@const skills = job.skills}
					<div class="rounded-xl border border-gray-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-6">
						<h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
							{t('jobs.skills')}
						</h2>
						<div class="flex flex-wrap gap-2">
							{#each skills as skill}
								<span class="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300">{skill}</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Apply -->
				{#if job.applyUrl}
					<div class="flex justify-center">
						<a
							href={job.applyUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="solid" size="lg">
								<ExternalLink size={16} />
								{t('jobs.apply')}
							</Button>
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Edit Job Modal -->
<FormModal
	open={editModal}
	title={t('jobs.edit')}
	loading={editLoading}
	onsubmit={handleEdit}
	oncancel={() => editModal = false}
>
	<div class="space-y-3">
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.title')} *</label>
			<Input bind:value={formTitle} placeholder="Software Engineer" required />
		</div>
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.company')} *</label>
			<Input bind:value={formCompany} placeholder="Acme Inc." required />
		</div>
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.location')}</label>
			<Input bind:value={formLocation} placeholder="Remote / San Francisco, CA" />
		</div>
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.type')} *</label>
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
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.description')} *</label>
			<textarea
				bind:value={formDescription}
				placeholder="Job description..."
				required
				rows={4}
				class="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none bg-white border-gray-200 text-gray-800 placeholder-gray-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-500"
			></textarea>
		</div>
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.requirements')}</label>
			<Input bind:value={formRequirements} placeholder="React, TypeScript, 3+ years..." />
			<span class="text-[10px] text-gray-500 dark:text-neutral-500">Comma-separated</span>
		</div>
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.skills')}</label>
			<Input bind:value={formSkills} placeholder="React, Node.js, PostgreSQL..." />
			<span class="text-[10px] text-gray-500 dark:text-neutral-500">Comma-separated</span>
		</div>
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.salary')}</label>
			<Input bind:value={formSalaryRange} placeholder="$80k - $120k" />
		</div>
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('jobs.applyUrl')}</label>
			<Input bind:value={formApplyUrl} placeholder="https://example.com/apply" type="url" />
		</div>
	</div>
</FormModal>

<!-- Delete Confirm Modal -->
<ConfirmModal
	open={deleteConfirm}
	title={t('jobs.delete')}
	message={t('jobs.confirmDelete')}
	loading={deleteLoading}
	onconfirm={handleDelete}
	oncancel={() => deleteConfirm = false}
/>
