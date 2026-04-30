<script lang="ts">
/**
 * FitScoreChip
 *
 * Inline fit-score badge with a hover-expand breakdown popover.
 * Drop-in compact variant of `FitScoreBreakdown` suited for list rows.
 *
 * Shows a traffic-light pill (green ≥ 80, amber 50–79, gray < 50) with the
 * percentage. On hover / focus, a popover reveals:
 *   - matched skills (what qualifies you)
 *   - missing skills (the gap to close)
 *   - english match (1 = meets, 0 = below, 0.5 = unknown)
 *   - remote match (1 = perfect, 0 = mismatch)
 *
 * Copy is caller-owned (`labels` prop) to keep the component i18n-neutral.
 */
import Badge from '../badge/badge.component.svelte';
import Popover from '../popover/popover.component.svelte';

type Props = {
  /** Overall fit, 0–100. */
  score: number;
  /** Skills on the job the user has. */
  matchedSkills?: string[];
  /** Skills on the job the user is missing. */
  missingSkills?: string[];
  /** 0–1 english alignment factor. */
  englishMatch?: number;
  /** 0–1 remote-policy alignment factor. */
  remoteMatch?: number;
  labels: {
    /** "match" — shown after the percentage. */
    match: string;
    /** "Your match breakdown". */
    title: string;
    /** "Matched skills". */
    matchedHeader: string;
    /** "Skills to add". */
    missingHeader: string;
    /** "English". */
    englishLabel: string;
    /** "Remote". */
    remoteLabel: string;
    /** "Meets requirement". */
    englishOk: string;
    /** "Below requirement". */
    englishBelow: string;
    /** "Not specified yet". */
    englishUnknown: string;
    /** "Perfect alignment". */
    remoteExact: string;
    /** "Partial alignment". */
    remotePartial: string;
    /** "Mismatch". */
    remoteMismatch: string;
    /** "None". */
    none: string;
  };
};

let {
  score,
  matchedSkills = [],
  missingSkills = [],
  englishMatch,
  remoteMatch,
  labels,
}: Props = $props();

const pct = $derived(Math.max(0, Math.min(100, Math.round(score))));

const tone = $derived(
  pct >= 80
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    : pct >= 50
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : 'bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300',
);

const englishSummary = $derived(
  englishMatch === undefined
    ? labels.englishUnknown
    : englishMatch >= 1
      ? labels.englishOk
      : englishMatch >= 0.5
        ? labels.englishUnknown
        : labels.englishBelow,
);

const remoteSummary = $derived(
  remoteMatch === undefined || remoteMatch === null
    ? '—'
    : remoteMatch >= 1
      ? labels.remoteExact
      : remoteMatch > 0
        ? labels.remotePartial
        : labels.remoteMismatch,
);

let open = $state(false);
</script>

<span
	class="inline-block"
	onmouseenter={() => (open = true)}
	onmouseleave={() => (open = false)}
	onfocusin={() => (open = true)}
	onfocusout={() => (open = false)}
	role="presentation"
>
	<Popover
		open={open}
		onClose={() => (open = false)}
		placement="bottom-start"
		label={labels.title}
		widthRem={18}
	>
		{#snippet trigger()}
			<button
				type="button"
				aria-label="{pct}% {labels.match}"
				aria-expanded={open}
				class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-current {tone}"
			>
				<span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-current"></span>
				{pct}% {labels.match}
			</button>
		{/snippet}

		<p class="mb-2 text-xs font-semibold text-gray-800 dark:text-neutral-200">{labels.title}</p>

		<div class="mb-2">
			<p class="mb-1 text-[10px] uppercase tracking-wide text-gray-500 dark:text-neutral-500">
				{labels.matchedHeader}
			</p>
			{#if matchedSkills.length === 0}
				<p class="text-xs text-gray-400 dark:text-neutral-600">{labels.none}</p>
			{:else}
				<div class="flex flex-wrap gap-1">
					{#each matchedSkills as skill}
						<Badge intent="success" size="md">{skill}</Badge>
					{/each}
				</div>
			{/if}
		</div>

		<div class="mb-2">
			<p class="mb-1 text-[10px] uppercase tracking-wide text-gray-500 dark:text-neutral-500">
				{labels.missingHeader}
			</p>
			{#if missingSkills.length === 0}
				<p class="text-xs text-gray-400 dark:text-neutral-600">{labels.none}</p>
			{:else}
				<div class="flex flex-wrap gap-1">
					{#each missingSkills as skill}
						<Badge intent="neutral" size="md">{skill}</Badge>
					{/each}
				</div>
			{/if}
		</div>

		<dl class="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2 text-[11px] dark:border-neutral-800">
			<div>
				<dt class="text-gray-500 dark:text-neutral-500">{labels.englishLabel}</dt>
				<dd class="font-medium text-gray-800 dark:text-neutral-200">{englishSummary}</dd>
			</div>
			<div>
				<dt class="text-gray-500 dark:text-neutral-500">{labels.remoteLabel}</dt>
				<dd class="font-medium text-gray-800 dark:text-neutral-200">{remoteSummary}</dd>
			</div>
		</dl>
	</Popover>
</span>
