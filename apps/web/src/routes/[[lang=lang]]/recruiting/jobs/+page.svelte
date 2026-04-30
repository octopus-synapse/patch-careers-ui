<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createJobsDelete,
  createJobsGetMyJobs,
  getJobsGetMyJobsQueryKey,
} from 'api-client';
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wifi,
} from 'lucide-svelte';
import type { Component } from 'svelte';
import { Badge, Button, DangerConfirmModal, EmptyState, Skeleton } from 'ui';
import { formatDate } from '$lib/utils/format-date';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

const jobsQuery = createJobsGetMyJobs(
  () => ({ page: 1, limit: 50 }),
  () => ({ query: { enabled: true } }),
);

const deleteMut = createJobsDelete(() => ({
  mutation: {
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: getJobsGetMyJobsQueryKey() });
      deleteTarget = null;
    },
  },
}));

type JobRow = {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  jobType: string;
  remotePolicy?: string | null;
  salaryRange?: string | null;
  isActive: boolean;
  createdAt: string;
};

const rows = $derived<JobRow[]>((jobsQuery.data?.items ?? []) as JobRow[]);

let deleteTarget = $state<{ id: string; title: string } | null>(null);

function jobTypeLabel(type: string): string {
  return t(`company.jobs.jobType.${type}`);
}

function remotePolicyLabel(policy: string | null | undefined): string | null {
  if (!policy) return null;
  return t(`company.jobs.remotePolicy.${policy}`);
}
</script>

<svelte:head>
	<title>{t('company.jobs.pageTitle')}</title>
</svelte:head>

<DangerConfirmModal
	open={deleteTarget !== null}
	onClose={() => (deleteTarget = null)}
	onConfirm={() => {
		if (deleteTarget) deleteMut.mutate({ id: deleteTarget.id });
	}}
	title={t('company.jobs.deleteTitle')}
	message={t('company.jobs.deleteMessage').replace('{title}', deleteTarget?.title ?? '')}
	confirmPhrase={t('company.jobs.deleteTypeKeyword')}
	confirmLabel={t('company.jobs.deleteConfirm')}
	loading={deleteMut.isPending}
/>

<div class="mx-auto max-w-5xl space-y-6 px-3 sm:px-6">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
				{t('company.jobs.title')}
			</h1>
			<p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
				{t('company.jobs.subtitle')}
			</p>
		</div>
		<a href="/recruiting/jobs/new" class="sm:shrink-0">
			<Button size="sm" textCase="normal">
				<Plus size={14} />
				{t('company.jobs.newJob')}
			</Button>
		</a>
	</header>

	{#if jobsQuery.isLoading}
		<div class="grid gap-3">
			{#each Array(4) as _}
				<div class="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-800/50">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 space-y-2">
							<Skeleton shape="text" width="40%" />
							<Skeleton shape="text" width="25%" />
						</div>
						<Skeleton shape="rect" width="5rem" height="1.5rem" />
					</div>
					<div class="flex gap-2">
						<Skeleton shape="rect" width="5rem" height="1.25rem" />
						<Skeleton shape="rect" width="5rem" height="1.25rem" />
					</div>
				</div>
			{/each}
		</div>
	{:else if rows.length === 0}
		<EmptyState
			message={t('company.jobs.empty')}
			icon={Briefcase as unknown as Component<{ size: number; class?: string }>}
		/>
	{:else}
		<div class="grid gap-3">
			{#each rows as job (job.id)}
				{@const remote = remotePolicyLabel(job.remotePolicy)}
				<article class="group flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:border-neutral-700">
					<!-- Title + status -->
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0 flex-1">
							<h2 class="truncate text-base font-semibold text-gray-900 dark:text-neutral-100">
								{job.title}
							</h2>
							<p class="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
								<Building2 size={12} />
								{job.company}
								{#if job.location}
									<span class="text-gray-300 dark:text-neutral-600">·</span>
									<MapPin size={12} />
									{job.location}
								{/if}
							</p>
						</div>
						<Badge intent={job.isActive ? 'accent' : 'neutral'} size="sm">
							{job.isActive ? t('company.jobs.statusActive') : t('company.jobs.statusInactive')}
						</Badge>
					</div>

					<!-- Meta badges -->
					<div class="flex flex-wrap items-center gap-2 text-xs">
						<Badge intent="neutral" size="md">
							<span class="inline-flex items-center gap-1">
								<Briefcase size={12} />
								{jobTypeLabel(job.jobType)}
							</span>
						</Badge>
						{#if remote}
							<Badge intent="neutral" size="md">
								<span class="inline-flex items-center gap-1">
									<Wifi size={12} />
									{remote}
								</span>
							</Badge>
						{/if}
						{#if job.salaryRange}
							<Badge intent="neutral" size="md">
								<span class="inline-flex items-center gap-1">
									<DollarSign size={12} />
									{job.salaryRange}
								</span>
							</Badge>
						{/if}
						{#if job.createdAt}
							<span class="inline-flex items-center gap-1 text-gray-400 dark:text-neutral-500">
								<Calendar size={12} />
								{t('company.jobs.postedOn').replace('{date}', formatDate(job.createdAt, locale.current, 'long'))}
							</span>
						{/if}
					</div>

					<!-- Actions -->
					<div class="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-neutral-700/60">
						<a href={`/recruiting/jobs/${job.id}/applications`}>
							<Button size="sm" variant="outline" textCase="normal">
								<Users size={12} />
								{t('company.jobs.col.applications')}
							</Button>
						</a>
						<a href={`/recruiting/jobs/${job.id}/edit`}>
							<Button size="sm" variant="ghost" textCase="normal">
								<Pencil size={12} />
								{t('company.jobs.editLabel')}
							</Button>
						</a>
						<Button
							size="sm"
							variant="ghost"
							intent="danger"
							textCase="normal"
							onclick={() => (deleteTarget = { id: job.id, title: job.title })}
							disabled={deleteMut.isPending}
						>
							<Trash2 size={12} />
							{t('company.jobs.deleteLabel')}
						</Button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
