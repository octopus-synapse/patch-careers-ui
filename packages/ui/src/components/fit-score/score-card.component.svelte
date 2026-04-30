<script lang="ts">
  import { rankOf, toneForScore, type ScoreRank } from './score-rank';
  import RankBadge from '../matching/rank-badge.component.svelte';

  type Props = {
    /** Main score 0-100. `null` renders the teaser state. */
    score: number | null;
    /** Header label shown above the score (e.g. "Resume Quality"). */
    label: string;
    /** Optional second line, usually a short explanation. */
    description?: string;
    /** Optional sub-metrics rendered as small rows (e.g. "Completeness: 82"). */
    subScores?: ReadonlyArray<{ label: string; score: number | null }>;
    /** Copy shown when the main score is null (e.g. "Complete your profile"). */
    teaser?: { title: string; body: string; cta?: { label: string; href: string } };
  };

  let { score, label, description, subScores, teaser }: Props = $props();

  const resolvedRank = $derived<ScoreRank | null>(
    typeof score === 'number' ? rankOf(score) : null,
  );
  const tone = $derived(typeof score === 'number' ? toneForScore(score) : '');
</script>

<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
  <div class="flex items-start justify-between gap-3">
    <div>
      <div class="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      {#if description}
        <div class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {description}
        </div>
      {/if}
    </div>
    {#if resolvedRank}
      <RankBadge rank={resolvedRank} size="sm" />
    {/if}
  </div>

  {#if typeof score === 'number'}
    <div class="mt-4 flex items-baseline gap-2">
      <span class="font-mono text-4xl font-bold tracking-tight {tone.split(' ')[1]}">
        {score}
      </span>
      <span class="text-sm text-neutral-500 dark:text-neutral-400">/ 100</span>
    </div>
    {#if subScores && subScores.length > 0}
      <ul class="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-xs dark:border-neutral-800">
        {#each subScores as sub (sub.label)}
          <li class="flex items-center justify-between">
            <span class="text-neutral-600 dark:text-neutral-400">{sub.label}</span>
            <span class="font-mono tabular-nums {sub.score === null ? 'text-neutral-400' : ''}">
              {sub.score === null ? '—' : sub.score}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  {:else if teaser}
    <div class="mt-4 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
      <div class="text-sm font-medium">{teaser.title}</div>
      <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{teaser.body}</p>
      {#if teaser.cta}
        <a
          href={teaser.cta.href}
          class="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
        >
          {teaser.cta.label} →
        </a>
      {/if}
    </div>
  {/if}
</div>
