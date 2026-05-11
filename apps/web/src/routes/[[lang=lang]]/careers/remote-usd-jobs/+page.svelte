<script lang="ts">
  /**
   * /careers/remote-usd-jobs — burra: lista vagas com paymentCurrency=USD.
   * Backend retorna `void` no schema OpenAPI; cast local da resposta.
   */
import { createGetV1Jobs } from 'api-client';
import { ArrowRight, Briefcase, Globe2, Sparkles } from 'lucide-svelte';
import { Badge, Button, Card, MatchBadge, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

type JobItem = {
  id: string;
  title?: string;
  company?: string;
  location?: string;
  salaryRange?: string;
  matchScore?: number;
};

const t = $derived(locale.t);

const query = createGetV1Jobs(
  { page: 1, limit: 30, paymentCurrency: 'USD' },
  { query: { enabled: () => browser} },
);

const jobs = $derived(
  ($query.data as { items?: JobItem[] } | undefined)?.items ?? ([] as JobItem[]),
);

const loading = $derived($query.isLoading);
</script>

<svelte:head>
	<title>{t('jobs.remoteUsd.pageTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<main class="mx-auto max-w-4xl px-4 sm:px-6">
		<header class="mb-8">
			<p class="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
				<Globe2 size={12} />
				{t('jobs.remoteUsd.heroTagline')}
			</p>
			<h1 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100 sm:text-4xl">
				{t('jobs.remoteUsd.heroTitle')}
			</h1>
			<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-neutral-400">
				{t('jobs.remoteUsd.heroSubtitle')}
			</p>
		</header>

		{#if loading && jobs.length === 0}
			<div class="space-y-3">
				{#each Array(4) as _}
					<Skeleton shape="rect" width="100%" height="5rem" />
				{/each}
			</div>
		{:else if jobs.length === 0}
			<Card>
				<div class="flex flex-col items-center gap-2 py-8 text-center">
					<Globe2 size={28} class="text-gray-300 dark:text-neutral-600" />
					<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">
						{t('jobs.remoteUsd.noneTitle')}
					</p>
					<p class="max-w-sm text-xs text-gray-500 dark:text-neutral-500">
						{t('jobs.remoteUsd.noneBody')}
					</p>
				</div>
			</Card>
		{:else}
			<ul class="space-y-3">
				{#each jobs as job (job.id)}
					<li>
						<button
							type="button"
							onclick={() => goto(`/careers/browse-jobs/${job.id}`)}
							class="group flex w-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-800/50 dark:hover:border-emerald-500/40 sm:flex-row sm:items-center"
						>
							<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/10">
								<Briefcase size={18} class="text-emerald-600 dark:text-emerald-300" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">
									{job.title ?? '—'}
								</p>
								<p class="truncate text-xs text-gray-500 dark:text-neutral-500">
									{[job.company, job.location].filter(Boolean).join(' · ')}
								</p>
								{#if job.salaryRange}
									<div class="mt-1">
										<Badge intent="success" size="md">
											<span class="inline-flex items-center gap-1">
												<Sparkles size={9} />
												{job.salaryRange}
											</span>
										</Badge>
									</div>
								{/if}
							</div>
							{#if typeof job.matchScore === 'number'}
								<MatchBadge score={job.matchScore} label={t('jobs.matchLabel')} />
							{/if}
							<ArrowRight
								size={14}
								class="hidden shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-neutral-500 sm:inline"
							/>
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="mt-8 flex justify-center">
			<Button variant="ghost" size="sm" onclick={() => goto('/jobs?remote=usd')}>
				{t('jobs.applicationsBrowse')}
				<ArrowRight size={14} />
			</Button>
		</div>
	</main>
</div>
