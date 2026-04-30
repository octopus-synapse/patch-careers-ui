<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { createJobsFindSimilar } from 'api-client';
import { Briefcase, MapPin } from 'lucide-svelte';
import { Card } from 'ui';
import { browser } from '$app/environment';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  jobId: string;
};

const { jobId }: Props = $props();

const t = $derived(locale.t);

const similarQuery = createJobsFindSimilar(
  () => jobId,
  () => ({ limit: 5 }),
  () => ({ query: { enabled: browser && !!jobId } }),
);

type SimilarJob = {
  id: string;
  title?: string;
  company?: string;
  location?: string | null;
  jobType?: string | null;
  skills?: string[];
  skillOverlap?: number;
};

const items = $derived(
  ((similarQuery.data as unknown as { items?: SimilarJob[] } | undefined)?.items ?? []) as SimilarJob[],
);
</script>

{#if items.length > 0}
	<Card class="sm:p-6">
		<h2 class="mb-3 text-xs font-semibold text-gray-500 dark:text-neutral-500">
			{t('jobs.similarTitle') ?? 'Vagas similares'}
		</h2>
		<ul class="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
			{#each items as job (job.id)}
				<li class="min-w-[240px] max-w-[280px] flex-shrink-0 snap-start">
					<a
						href="/careers/browse-jobs/{job.id}"
						class="flex h-full flex-col gap-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 transition-colors hover:border-gray-300 dark:hover:border-neutral-600"
					>
						<span class="text-sm font-medium text-gray-800 dark:text-neutral-200 line-clamp-2">
							{job.title ?? '---'}
						</span>
						<span class="text-xs text-gray-500 dark:text-neutral-500 line-clamp-1">
							{job.company ?? '---'}
						</span>
						<div class="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-500">
							{#if job.jobType}
								<span class="inline-flex items-center gap-1">
									<Briefcase size={10} />
									{job.jobType}
								</span>
							{/if}
							{#if job.location}
								<span class="inline-flex items-center gap-1">
									<MapPin size={10} />
									{job.location}
								</span>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</Card>
{/if}
