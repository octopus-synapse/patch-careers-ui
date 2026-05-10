<script lang="ts">
  import { createPostV1Match, isApiError } from 'api-client';
  import type { PostV1Match201 } from 'api-client';

  import { onMount } from 'svelte';
  import { Loader, ScoreCard } from 'ui';

  /**
   * Match Score panel — frontend-burro: every visible string and color comes
   * from the backend. The hook iterates over `subScores` (keyword,
   * requirements, semantic, fit) exactly as it lands on the wire.
   *
   * Backend endpoint: POST /api/v1/job-match (T11.2 of F1).
   */

  type Teaser = {
    title: string;
    body: string;
    cta?: { label: string; href: string };
  };

  type Props = {
    resumeId: string;
    jobId: string;
  };

  let { resumeId, jobId }: Props = $props();

  const matchMutation = createPostV1Match({ mutation: {} });

  let breakdown = $state<PostV1Match201 | null>(null);
  let lockoutTeaser = $state<Teaser | null>(null);
  let errorTeaser = $state<Teaser | null>(null);
  let loading = $state(true);

  async function runCompute() {
    loading = true;
    errorTeaser = null;
    lockoutTeaser = null;
    try {
      breakdown = await $matchMutation.mutateAsync({
        data: { resumeId, jobId },
      });
    } catch (err) {
      breakdown = null;
      // 409 fit_profile_required → the backend's `suggestedAction` carries
      // the CTA copy and href so the frontend doesn't have to know that
      // detail. Fall through to a generic teaser when the action isn't set.
      if (isApiError(err) && err.statusCode === 409) {
        const action = err.suggestedAction;
        lockoutTeaser = {
          title: err.message,
          body: err.message,
          cta:
            action?.label && action?.href
              ? { label: action.label, href: action.href }
              : undefined,
        };
      } else if (isApiError(err)) {
        errorTeaser = { title: err.message, body: err.message };
      } else {
        errorTeaser = { title: 'Erro', body: 'Não foi possível calcular o match.' };
      }
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void runCompute();
  });

  // Recompute when props change — the backend's Redis cache makes this
  // essentially free after the first resolve.
  $effect(() => {
    if (resumeId && jobId) void runCompute();
  });

  const subScores = $derived.by(() => {
    if (!breakdown) return [];
    const s = breakdown.subScores;
    return [
      { label: 'Keyword', score: s.keyword.score },
      { label: 'Requirements', score: s.requirements.score },
      { label: 'Semantic', score: s.semantic.score },
      { label: 'Fit', score: s.fit.score },
    ];
  });
</script>

{#if loading && !breakdown}
  <div class="flex h-[160px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
    <Loader size={20} />
  </div>
{:else if lockoutTeaser}
  <ScoreCard score={null} label="Match Score" teaser={lockoutTeaser} />
{:else if errorTeaser}
  <ScoreCard score={null} label="Match Score" teaser={errorTeaser} />
{:else if breakdown}
  <ScoreCard
    score={breakdown.overallScore}
    label="Match Score"
    subScores={subScores}
  />
{/if}
