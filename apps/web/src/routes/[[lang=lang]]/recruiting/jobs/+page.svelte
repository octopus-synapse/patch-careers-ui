<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createJobsDelete,
  createJobsGetMyJobs,
  getJobsGetMyJobsQueryKey,
} from 'api-client';
import { Loader2, Pencil, Plus, Trash2, Users } from 'lucide-svelte';
import { Button } from 'ui';
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
    },
  },
}));

const rows = $derived(jobsQuery.data?.items ?? []);

async function onDelete(id: string) {
  if (!confirm(t('company.jobs.confirmDelete'))) return;
  await deleteMut.mutateAsync({ id });
}
</script>

<svelte:head>
	<title>{t('company.jobs.pageTitle')}</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
				{t('company.jobs.title')}
			</h1>
			<p class="text-sm text-gray-500 dark:text-neutral-400 mt-1">
				{t('company.jobs.subtitle')}
			</p>
		</div>
		<a href="/recruiting/jobs/new">
			<Button size="sm">
				<Plus size={16} />
				{t('company.jobs.newJob')}
			</Button>
		</a>
	</header>

	{#if jobsQuery.isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader2 size={24} class="animate-spin text-gray-500" />
		</div>
	{:else if rows.length === 0}
		<div class="rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 p-12 text-center text-sm text-gray-500 dark:text-neutral-400">
			{t('company.jobs.empty')}
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-800">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 uppercase text-xs tracking-wide">
					<tr>
						<th class="px-4 py-3 text-left">{t('company.jobs.col.title')}</th>
						<th class="px-4 py-3 text-left">{t('company.jobs.col.type')}</th>
						<th class="px-4 py-3 text-left">{t('company.jobs.col.remote')}</th>
						<th class="px-4 py-3 text-right">{t('company.jobs.col.actions')}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
					{#each rows as job}
						<tr>
							<td class="px-4 py-3">
								<div class="font-medium text-gray-900 dark:text-neutral-100">{job.title}</div>
								<div class="text-xs text-gray-500 dark:text-neutral-400">{job.company}</div>
							</td>
							<td class="px-4 py-3 text-gray-700 dark:text-neutral-300">{job.jobType}</td>
							<td class="px-4 py-3 text-gray-700 dark:text-neutral-300">{job.remotePolicy ?? '—'}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex justify-end gap-2">
									<a href={`/recruiting/jobs/${job.id}/applications`}>
										<Button size="sm" variant="ghost">
											<Users size={14} />
											{t('company.jobs.col.applications')}
										</Button>
									</a>
									<a href={`/recruiting/jobs/${job.id}/edit`}>
										<Button size="sm" variant="ghost">
											<Pencil size={14} />
										</Button>
									</a>
									<Button
										size="sm"
										variant="ghost"
										onclick={() => onDelete(job.id)}
										disabled={deleteMut.isPending}
									>
										<Trash2 size={14} />
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
