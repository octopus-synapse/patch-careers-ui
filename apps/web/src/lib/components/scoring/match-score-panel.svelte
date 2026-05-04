<script lang="ts">
  import { createJobMatchMatchPost, isApiError } from 'api-client';

  import { onMount } from 'svelte';
  import { Loader, ScoreCard } from 'ui';

  /**
   * Match Score panel — frontend-burro: every visible string and color comes
   * from the backend. The hook iterates over `dimensions: [{key, label,
   * value, target?, color?, hint?, weight?}]` exactly as it lands on the
   * wire. No local table maps a dimension key to a label or to a tone — if
   * a new dimension ships, it shows up automatically.
   *
   * Backend endpoint: POST /api/v1/job-match (T11.2 of F1). The response
   * envelope is `{ overallScore, dimensions, ... }`. Until the swagger ships
   * a tightened schema we cast the SDK response to the structural shape we
   * need.
   */

  type Dimension = {
    key: string;
    label: string;
    value: number | null;
    target?: number | null;
    color?: string | null;
    hint?: string | null;
    weight?: number | null;
  };

  type MatchBreakdown = {
    overallScore: number;
    dimensions: Dimension[];
  };

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

  const matchMutation = createJobMatchMatchPost({ mutation: {} });

  let breakdown = $state<MatchBreakdown | null>(null);
  let lockoutTeaser = $state<Teaser | null>(null);
  let errorTeaser = $state<Teaser | null>(null);
  let loading = $state(true);

  async function runCompute() {
    loading = true;
    errorTeaser = null;
    lockoutTeaser = null;
    try {
      // Cast: the SDK's typed response is `{ data: void }` because the
      // swagger spec hasn't shipped a schema yet. Trust the runtime payload.
      const res = (await $matchMutation.mutateAsync({
        data: { resumeId, jobId },
      })) as unknown as MatchBreakdown | null;

      if (res && typeof res.overallScore === 'number' && Array.isArray(res.dimensions)) {
        breakdown = res;
      } else {
        breakdown = null;
      }
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

  const subScores = $derived(
    breakdown?.dimensions.map((d) => ({ label: d.label, score: d.value })) ?? [],
  );
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
