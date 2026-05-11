<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1JobsBookmarks,
  createDeleteV1JobsIdBookmark,
  getV1JobsBookmarks,
  getV1JobsBookmarksQueryKey,
  type GetV1JobsBookmarks200,
} from 'api-client';
import { Bookmark, Briefcase, Building2, DollarSign, MapPin } from 'lucide-svelte';
import { Badge, Button, Card, EmptyState, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { asIcon } from '$lib/types/icons';
import { track } from '$lib/utils/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';
import { InfiniteScrollTrigger } from 'ui';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated);

type SavedJob = GetV1JobsBookmarks200['items'][number];

const query = createGetV1JobsBookmarks(
  { page: 1, limit: 20 },
  { query: { enabled: () => browser && authenticated} },
);

const firstPage = $derived($query.data);
let extra = $state<SavedJob[]>([]);
let pageNum = $state(1);
let loadingMore = $state(false);
let removedIds = $state<Set<string>>(new Set());

async function loadMore() {
  if (loadingMore) return;
  loadingMore = true;
  try {
    const next = pageNum + 1;
    const res = await getV1JobsBookmarks({ page: next, limit: 20 });
    extra = [...extra, ...res.items];
    pageNum = next;
  } finally {
    loadingMore = false;
  }
}

const all = $derived.by<SavedJob[]>(() => {
  const head = firstPage ? firstPage.items : [];
  return [...head, ...extra].filter((j) => !removedIds.has(j.id));
});

const queryClient = useQueryClient();

const unbookmarkMutation = createDeleteV1JobsIdBookmark({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getV1JobsBookmarksQueryKey() });
      track('job_unbookmarked', { jobId: vars.id });
    },
    onError(_err, vars) {
      const next = new Set(removedIds);
      next.delete(vars.id);
      removedIds = next;
      toastState.show(t('jobs.unsaveError'), 'danger');
    },
  },
});

function handleRemove(id: string) {
  removedIds = new Set([...removedIds, id]);
  $unbookmarkMutation.mutate({ id });
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
			{#if firstPage && firstPage.total > 0}
				<span class="text-xs text-gray-500 dark:text-neutral-500">{firstPage.total}</span>
			{/if}
		</header>

		{#if $query.isLoading}
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
				icon={asIcon(Bookmark)}
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
									onclick={() => goto(`/careers/browse-jobs/${job.id}`)}
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
											<Badge intent="neutral" size="md">{skill}</Badge>
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
				hasMore={firstPage ? pageNum < firstPage.totalPages : false}
				isLoading={loadingMore}
			/>
		{/if}
	</div>
</div>
