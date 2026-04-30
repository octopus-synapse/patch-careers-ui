<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { createJobsGetMyApplications } from 'api-client';
import { Badge, Button, Card, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';
import {
  statusIntent as resolveStatusIntent,
  statusLabel as resolveStatusLabel,
} from '$lib/utils/application-status';

type ApplicationItem = {
  id?: string;
  jobId?: string;
  status?: string;
  appliedAt?: string;
  job?: { id?: string; title?: string; company?: string };
  jobTitle?: string;
  company?: string;
};

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

const query = createJobsGetMyApplications(
  () => ({ page: 1, limit: 5 }),
  () => ({ query: { enabled: browser && authenticated } }),
);

const items = $derived.by<ApplicationItem[]>(() => {
  const d = query.data as Record<string, unknown> | undefined;
  const candidate =
    (d?.data as ApplicationItem[] | undefined) ??
    (d?.applications as ApplicationItem[] | undefined) ??
    (Array.isArray(d) ? (d as ApplicationItem[]) : undefined) ??
    [];
  return candidate;
});

const statusIntent = (status?: string) => resolveStatusIntent(status);
const statusLabel = (status?: string) => resolveStatusLabel(status, t);
</script>

<Card>
	{#snippet title()}
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
				{t('dashboard.applicationsTitle')}
			</h2>
			{#if items.length > 0}
				<a
					href="/careers/browse-jobs?tab=applications"
					class="text-xs font-medium text-cyan-600 hover:underline dark:text-cyan-300"
				>
					{t('dashboard.applicationsSeeAll')}
				</a>
			{/if}
		</div>
	{/snippet}

	{#if query.isLoading}
		<ul class="space-y-3">
			{#each Array(3) as _}
				<li class="flex items-center gap-3">
					<div class="flex-1 space-y-1.5">
						<Skeleton shape="text" width="60%" />
						<Skeleton shape="text" width="40%" />
					</div>
					<Skeleton shape="rect" width="4rem" height="1.25rem" />
				</li>
			{/each}
		</ul>
	{:else if items.length === 0}
		<div
			class="flex flex-col items-start gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-5 dark:border-neutral-800 dark:bg-neutral-900/60"
		>
			<p class="text-sm text-gray-700 dark:text-neutral-300">
				{t('dashboard.applicationsEmpty')}
			</p>
			<Button variant="solid" intent="accent" size="sm" onclick={() => goto('/careers/browse-jobs')}>
				{t('dashboard.applicationsCtaFirst')}
			</Button>
		</div>
	{:else}
		<ul class="-mx-2 divide-y divide-gray-100 dark:divide-neutral-800/80">
			{#each items as app (app.id ?? app.jobId)}
				{@const title = app.job?.title ?? app.jobTitle ?? '—'}
				{@const company = app.job?.company ?? app.company ?? ''}
				{@const jobId = app.job?.id ?? app.jobId}
				<li>
					<button
						type="button"
						class="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
						onclick={() => jobId && goto(`/careers/browse-jobs/${jobId}`)}
					>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900 group-hover:text-cyan-700 dark:text-neutral-100 dark:group-hover:text-cyan-300">
								{title}
							</p>
							{#if company}
								<p class="truncate text-xs text-gray-500 dark:text-neutral-500">{company}</p>
							{/if}
						</div>
						{#if app.status}
							<Badge intent={statusIntent(app.status)} size="sm">
								{statusLabel(app.status)}
							</Badge>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</Card>
