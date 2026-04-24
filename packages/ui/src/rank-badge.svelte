<script lang="ts">
  import { rankOf, toneForScore, type ScoreRank } from './score-rank';

  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    /** 0-100 score. Ignored when `rank` is passed explicitly. */
    score?: number;
    /** Pre-computed rank. Takes precedence over `score`. */
    rank?: ScoreRank;
    /** Optional label shown next to the letter (e.g. "Quality"). */
    label?: string;
    size?: Size;
    /** Whether to show the numeric score in parentheses after the rank. */
    showScore?: boolean;
  };

  let {
    score,
    rank: explicitRank,
    label,
    size = 'md',
    showScore = false,
  }: Props = $props();

  const resolvedRank = $derived<ScoreRank>(
    explicitRank ?? (typeof score === 'number' ? rankOf(score) : 'F'),
  );
  const tone = $derived(toneForScore(typeof score === 'number' ? score : 0));

  const sizeClass = $derived(
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px] font-semibold'
      : size === 'lg'
        ? 'px-3 py-1.5 text-base font-bold'
        : 'px-2 py-0.5 text-xs font-semibold',
  );
</script>

<span
  class="inline-flex items-center gap-1 rounded-full uppercase tracking-wide {sizeClass} {tone}"
  title="Rank {resolvedRank}{typeof score === 'number' ? ` (${score}/100)` : ''}"
>
  <span aria-hidden="true">{resolvedRank}</span>
  {#if showScore && typeof score === 'number'}
    <span class="font-mono opacity-80">{score}</span>
  {/if}
  {#if label}
    <span class="normal-case tracking-normal opacity-80">· {label}</span>
  {/if}
</span>
