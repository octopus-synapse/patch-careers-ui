<script lang="ts">
import Button from '../button/button.component.svelte';
import Card from '../card/card.component.svelte';
import type { FitDimension, FitScoreLabels } from './fit-score.types';

type Props = {
  /** Overall fit, 0–100. Omit to render the teaser state. */
  score?: number;
  dimensions?: FitDimension[];
  matched?: string[];
  missing?: string[];
  /** Localized strings. Caller owns i18n. */
  labels: FitScoreLabels;
  /** When `score` is absent we render a teaser; clicking the CTA goes here. */
  onTeaserCta?: () => void;
  class?: string;
};

let {
  score,
  dimensions = [],
  matched = [],
  missing = [],
  labels,
  onTeaserCta,
  class: className = '',
}: Props = $props();

const hasScore = $derived(typeof score === 'number');
const pct = $derived(hasScore ? Math.max(0, Math.min(100, Math.round(score as number))) : 0);

const scoreTone = $derived(
  pct >= 80
    ? 'text-emerald-600 dark:text-emerald-400'
    : pct >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400',
);

const ringGradient = $derived(
  pct >= 80
    ? 'from-emerald-400 to-emerald-600'
    : pct >= 50
      ? 'from-amber-400 to-orange-500'
      : 'from-rose-400 to-rose-600',
);
</script>

<Card class={className}>
	{#snippet title()}
		<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
			{labels.title}
		</h2>
	{/snippet}

	{#if !hasScore}
		<div class="flex flex-col items-start gap-3">
			<div class="flex items-center gap-3">
				<!-- Greyed-out ring so the teaser still looks like a score card. -->
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800"
					aria-hidden="true"
				>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-800">
						<span class="text-sm font-bold text-gray-400 dark:text-neutral-600">?</span>
					</div>
				</div>
				<div>
					<p class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
						{labels.teaserTitle}
					</p>
					<p class="mt-0.5 text-xs text-gray-500 dark:text-neutral-500">
						{labels.teaserBody}
					</p>
				</div>
			</div>
			{#if onTeaserCta}
				<Button variant="outline" size="sm" onclick={onTeaserCta}>
					{labels.teaserCta}
				</Button>
			{/if}
		</div>
	{:else}
		<div class="flex items-center gap-4">
			<div
				class="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br {ringGradient}"
				role="img"
				aria-label={labels.scoreAria(pct)}
			>
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-neutral-800">
					<span class="text-lg font-bold tabular-nums {scoreTone}">{pct}%</span>
				</div>
			</div>
			<div class="flex-1">
				{#if dimensions.length > 0}
					<p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
						{labels.breakdownTitle}
					</p>
					<ul class="space-y-1.5">
						{#each dimensions as dim (dim.key)}
							{@const v = Math.max(0, Math.min(100, Math.round(dim.value)))}
							<li class="flex items-center gap-2">
								<span class="min-w-[5.5rem] text-[11px] text-gray-600 dark:text-neutral-400">{dim.label}</span>
								<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-700/60">
									<div
										class="h-full rounded-full bg-gradient-to-r {ringGradient} transition-all duration-500"
										style:width="{v}%"
									></div>
								</div>
								<span class="min-w-[2.25rem] text-right text-[11px] font-semibold tabular-nums text-gray-700 dark:text-neutral-300">
									{v}%
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>

		{#if matched.length > 0 || missing.length > 0}
			<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#if matched.length > 0}
					<div>
						<p class="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
							{labels.matchedTitle}
						</p>
						<ul class="flex flex-wrap gap-1.5">
							{#each matched as skill}
								<li
									class="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
									{skill}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if missing.length > 0}
					<div>
						<p class="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
							{labels.missingTitle}
						</p>
						<ul class="flex flex-wrap gap-1.5">
							{#each missing as skill}
								<li
									class="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
									{skill}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</Card>
