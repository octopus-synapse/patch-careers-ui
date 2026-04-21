<script lang="ts">
import { getBaseUrl } from 'api-client/client';
import { createQuery } from '@tanstack/svelte-query';
import { Loader2, ArrowLeft } from 'lucide-svelte';
import { Button } from 'ui';
import { page } from '$app/stores';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const jobId = $derived($page.params.id ?? '');

type ApplicationUser = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  photoURL: string | null;
};

type ApplicationItem = {
  id: string;
  status: string;
  createdAt: string;
  coverLetter: string | null;
  resumeId: string | null;
  tailoredVersionId: string | null;
  user: ApplicationUser | null;
};

type ApplicationsResponse = {
  data: {
    items: ApplicationItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  };
};

async function fetchApplications(id: string): Promise<ApplicationsResponse> {
  const res = await fetch(`${getBaseUrl()}/v1/jobs/${id}/applications?page=1&limit=100`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed with ${res.status}`);
  return res.json();
}

const query = createQuery(() => ({
  queryKey: ['company-applications', jobId],
  queryFn: () => fetchApplications(jobId),
  enabled: Boolean(jobId),
}));

const items = $derived(query.data?.data?.items ?? []);
const total = $derived(query.data?.data?.pagination?.total ?? 0);
</script>

<svelte:head>
	<title>{t('company.applications.pageTitle')}</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<a href="/company/jobs" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200">
				<ArrowLeft size={14} />
				{t('company.applications.backToJobs')}
			</a>
			<h1 class="mt-2 text-2xl font-semibold text-gray-900 dark:text-neutral-100">
				{t('company.applications.title')}
			</h1>
			<p class="text-sm text-gray-500 dark:text-neutral-400 mt-1">
				{total} {t('company.applications.received')}
			</p>
		</div>
	</header>

	{#if query.isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader2 size={24} class="animate-spin text-gray-500" />
		</div>
	{:else if query.error}
		<div class="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
			{query.error instanceof Error ? query.error.message : 'Error'}
		</div>
	{:else if items.length === 0}
		<div class="rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 p-12 text-center text-sm text-gray-500 dark:text-neutral-400">
			{t('company.applications.empty')}
		</div>
	{:else}
		<ul class="space-y-3">
			{#each items as item}
				<li class="rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
					<div class="flex items-start justify-between gap-4">
						<div class="flex items-center gap-3">
							{#if item.user?.photoURL}
								<img src={item.user.photoURL} alt="" class="h-10 w-10 rounded-full object-cover" />
							{:else}
								<div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-800"></div>
							{/if}
							<div>
								<div class="font-medium text-gray-900 dark:text-neutral-100">
									{item.user?.name ?? item.user?.username ?? t('company.applications.anonymous')}
								</div>
								<div class="text-xs text-gray-500 dark:text-neutral-400">
									{item.user?.email ?? '—'}
								</div>
							</div>
						</div>
						<div class="text-xs text-gray-500 dark:text-neutral-400">
							<div>{item.status}</div>
							<div>{new Date(item.createdAt).toLocaleDateString()}</div>
						</div>
					</div>

					{#if item.coverLetter}
						<p class="mt-3 text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">
							{item.coverLetter}
						</p>
					{/if}

					<div class="mt-3 flex flex-wrap gap-2">
						{#if item.user?.username}
							<a href={`/@${item.user.username}`} target="_blank" rel="noopener">
								<Button size="sm" variant="ghost">
									{t('company.applications.viewProfile')}
								</Button>
							</a>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
