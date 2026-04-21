<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createJobsGetBookmarkedJobs,
  createJobsUnbookmark,
  getJobsGetBookmarkedJobsQueryKey,
  jobsGetBookmarkedJobs,
} from 'api-client';
import { Bookmark, Briefcase, Building2, DollarSign, MapPin } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Button, Card, EmptyState, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { track } from '$lib/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';
import InfiniteScrollTrigger from '../../mynetwork/InfiniteScrollTrigger.svelte';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

type SavedJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  jobType: string;
  salaryRange: string | null;
  skills: string[];
};

const query = createJobsGetBookmarkedJobs(
  () => ({ page: 1, limit: 20 }),
  () => ({ query: { enabled: browser && authenticated } }),
);

function rowsFrom(items?: Record<string, unknown>[]): SavedJob[] {
  return (items ?? []).map((r) => ({
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    company: String(r.company ?? ''),
    location: (r.location as string | null) ?? null,
    jobType: String(r.jobType ?? ''),
    salaryRange: (r.salaryRange as string | null) ?? null,
    skills: Array.isArray(r.skills) ? (r.skills as string[]) : [],
  }));
}

function pagedSection(data: unknown): { rows: SavedJob[]; total: number; totalPages: number } {
  const outer = data as Record<string, unknown> | undefined;
  const items = (outer?.data as Record<string, unknown>[] | undefined) ?? [];
  return {
    rows: rowsFrom(items),
    total: Number(outer?.total ?? 0),
    totalPages: Number(outer?.totalPages ?? 0),
  };
}

const firstPage = $derived(pagedSection(query.data));
let extra = $state<SavedJob[]>([]);
let pageNum = $state(1);
let loadingMore = $state(false);
let removedIds = $state<Set<string>>(new Set());

async function loadMore() {
  if (loadingMore) return;
  loadingMore = true;
  try {
    const next = pageNum + 1;
    const res = (await jobsGetBookmarkedJobs({ page: next, limit: 20 })) as unknown as
      | Record<string, unknown>
      | undefined;
    const items = (res?.data as Record<string, unknown>[] | undefined) ?? [];
    extra = [...extra, ...rowsFrom(items)];
    pageNum = next;
  } finally {
    loadingMore = false;
  }
}

const all = $derived([...firstPage.rows, ...extra].filter((j) => !removedIds.has(j.id)));

const queryClient = useQueryClient();

const unbookmarkMutation = createJobsUnbookmark(() => ({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getJobsGetBookmarkedJobsQueryKey() });
      track('job_unbookmarked', { jobId: vars.id });
    },
    onError(_err, vars) {
      const next = new Set(removedIds);
      next.delete(vars.id);
      removedIds = next;
      toastState.show(t('jobs.unsaveError'), 'danger');
    },
  },
}));

function handleRemove(id: string) {
  removedIds = new Set([...removedIds, id]);
  unbookmarkMutation.mutate({ id });
}
</script>

<svelte:head>
	<title>{t('jobs.savedTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-4xl px-3 sm:px-6">
		<header class="mb-4 flex items-center justify-between">
			<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">
				{t('jobs.savedTitle')}
			</h1>
			{#if firstPage.total > 0}
				<span class="text-xs text-gray-500 dark:text-neutral-500">{firstPage.total}</span>
			{/if}
		</header>

		{#if query.isLoading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="rounded-xl border p-4 border-gray-200 dark:border-neutral-800">
						<Skeleton shape="text" width="60%" />
						<div class="mt-2">
							<Skeleton shape="text" width="40%" />
						</div>
					</div>
				{/each}
			</div>
		{:else if all.length === 0}
			<EmptyState
				message={t('jobs.savedEmpty')}
				icon={Bookmark as unknown as Component<{ size: number; class?: string }>}
			/>
		{:else}
			<div class="space-y-3">
				{#each all as job (job.id)}
					<Card>
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<button
									type="button"
									class="text-left text-base font-semibold text-gray-800 hover:underline dark:text-neutral-200"
									onclick={() => goto(`/jobs/${job.id}`)}
								>
									{job.title}
								</button>
								<div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-neutral-500">
									{#if job.company}
										<span class="flex items-center gap-1">
											<Building2 size={12} />
											{job.company}
										</span>
									{/if}
									{#if job.location}
										<span class="flex items-center gap-1">
											<MapPin size={12} />
											{job.location}
										</span>
									{/if}
									{#if job.jobType}
										<span class="flex items-center gap-1">
											<Briefcase size={12} />
											{job.jobType}
										</span>
									{/if}
									{#if job.salaryRange}
										<span class="flex items-center gap-1">
											<DollarSign size={12} />
											{job.salaryRange}
										</span>
									{/if}
								</div>
								{#if job.skills.length > 0}
									<div class="mt-2 flex flex-wrap gap-1">
										{#each job.skills.slice(0, 5) as skill}
											<span class="rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300">
												{skill}
											</span>
										{/each}
									</div>
								{/if}
							</div>
							<Button variant="outline" size="sm" onclick={() => handleRemove(job.id)}>
								<Bookmark size={14} fill="currentColor" />
								{t('jobs.unsaveJob')}
							</Button>
						</div>
					</Card>
				{/each}
			</div>
			<InfiniteScrollTrigger
				onLoadMore={loadMore}
				hasMore={pageNum < firstPage.totalPages}
				isLoading={loadingMore}
			/>
		{/if}
	</div>
</div>
