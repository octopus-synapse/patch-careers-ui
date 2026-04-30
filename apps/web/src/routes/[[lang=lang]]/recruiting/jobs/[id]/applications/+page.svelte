<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { createJobsGetApplicationsForJob } from 'api-client';
import { ArrowLeft } from 'lucide-svelte';
import { Avatar, Button, Loader } from 'ui';
import { page } from '$app/stores';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const jobId = $derived($page.params.id ?? '');

const query = createJobsGetApplicationsForJob(
  () => jobId,
  () => ({ page: 1, limit: 100 }),
  () => ({ query: { enabled: Boolean(jobId) } }),
);

const items = $derived(query.data?.items ?? []);
const total = $derived(query.data?.pagination.total ?? 0);
const errorMessage = $derived(query.error instanceof Error ? query.error.message : null);

const STATUS_ORDER = ['SUBMITTED', 'VIEWED', 'INTERVIEW', 'OFFER', 'HIRED'] as const;
type StatusKey = (typeof STATUS_ORDER)[number] | 'REJECTED';

const STATUS_LABEL: Record<StatusKey, string> = {
  SUBMITTED: 'Enviadas',
  VIEWED: 'Visualizadas',
  INTERVIEW: 'Entrevista',
  OFFER: 'Oferta',
  HIRED: 'Contratadas',
  REJECTED: 'Rejeitadas',
};

const STATUS_COLOR: Record<StatusKey, string> = {
  SUBMITTED: 'bg-gray-300 dark:bg-neutral-600',
  VIEWED: 'bg-blue-400',
  INTERVIEW: 'bg-amber-400',
  OFFER: 'bg-violet-400',
  HIRED: 'bg-emerald-500',
  REJECTED: 'bg-red-400',
};

let statusFilter = $state<string>('ALL');

const counts = $derived.by(() => {
  const map: Record<string, number> = {};
  for (const item of items) {
    const key = String(item.status);
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
});

const filteredItems = $derived(
  statusFilter === 'ALL' ? items : items.filter((i) => String(i.status) === statusFilter),
);

const funnelMax = $derived(Math.max(1, ...STATUS_ORDER.map((s) => counts[s] ?? 0)));
</script>

<svelte:head>
	<title>{t('company.applications.pageTitle')}</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<a href="/recruiting/jobs" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200">
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

	{#if items.length > 0}
		<!-- Funnel bar -->
		<div class="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
			<h2 class="mb-3 text-xs font-semibold text-gray-500 dark:text-neutral-500">Funil</h2>
			<div class="space-y-2">
				{#each STATUS_ORDER as status}
					{@const n = counts[status] ?? 0}
					{@const pct = Math.round((n / funnelMax) * 100)}
					<div class="flex items-center gap-3 text-xs">
						<span class="w-28 shrink-0 text-gray-600 dark:text-neutral-400">{STATUS_LABEL[status]}</span>
						<div class="relative h-5 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-neutral-800">
							<div class="h-full {STATUS_COLOR[status]} transition-all duration-500" style:width="{pct}%"></div>
						</div>
						<span class="w-10 text-right font-mono text-gray-700 dark:text-neutral-300">{n}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Status filter chips -->
		<div class="flex flex-wrap gap-1.5">
			<button
				type="button"
				onclick={() => (statusFilter = 'ALL')}
				class="rounded-full px-3 py-1 text-xs font-medium transition-colors {statusFilter === 'ALL' ? 'bg-gray-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:text-neutral-400'}"
			>
				Todas · {items.length}
			</button>
			{#each [...STATUS_ORDER, 'REJECTED'] as status}
				{@const n = counts[status] ?? 0}
				{#if n > 0}
					<button
						type="button"
						onclick={() => (statusFilter = status)}
						class="rounded-full px-3 py-1 text-xs font-medium transition-colors {statusFilter === status ? 'bg-gray-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:text-neutral-400'}"
					>
						{STATUS_LABEL[status as StatusKey]} · {n}
					</button>
				{/if}
			{/each}
		</div>
	{/if}

	{#if query.isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader size={24} />
		</div>
	{:else if errorMessage}
		<div class="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
			{errorMessage}
		</div>
	{:else if items.length === 0}
		<div class="rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 p-12 text-center text-sm text-gray-500 dark:text-neutral-400">
			{t('company.applications.empty')}
		</div>
	{:else}
		<ul class="space-y-3">
			{#each filteredItems as item}
				<li class="rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
					<div class="flex items-start justify-between gap-4">
						<div class="flex items-center gap-3">
							<Avatar
								name={item.user?.name ?? item.user?.username ?? ''}
								photoURL={item.user?.photoURL ?? null}
								size="md"
							/>
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
							<a href={`/my-profile/public/@${item.user.username}`} target="_blank" rel="noopener">
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
