<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
  import { createJobMatchComputeNow, isApiError } from 'api-client';

  import { onMount } from 'svelte';
  import { Loader, ScoreCard } from 'ui';

  type SubScores = {
    keyword: number | null;
    requirements: number | null;
    semantic: number | null;
    fit: number | null;
  };

  type Props = {
    resumeId: string;
    jobId: string;
  };

  let { resumeId, jobId }: Props = $props();

  const matchMutation = createJobMatchComputeNow(() => ({ mutation: {} }));

  let breakdown = $state<{ overall: number; subs: SubScores } | null>(null);
  let lockoutMessage = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);
  let loading = $state(true);

  async function runCompute() {
    loading = true;
    errorMessage = null;
    lockoutMessage = null;
    try {
      const res = await matchMutation.mutateAsync({
        data: { resumeId, jobId },
      });
      // The mutation type is the envelope `MatchBreakdownDto`.
      const subs = res.subScores as unknown as SubScores;
      breakdown = {
        overall: res.overallScore,
        subs: {
          keyword: subs.keyword ?? null,
          requirements: subs.requirements ?? null,
          semantic: subs.semantic ?? null,
          fit: subs.fit ?? null,
        },
      };
    } catch (err) {
      breakdown = null;
      // 409 fit_profile_required → the global lockout interceptor (4.6)
      // surfaces the modal; this panel just shows the teaser so the
      // empty state is obvious even when the modal is dismissed.
      if (isApiError(err) && err.statusCode === 409) {
        lockoutMessage = 'Complete seu Fit Profile para ver o Match Score.';
      } else {
        errorMessage = isApiError(err) ? err.message : 'Não foi possível calcular o match.';
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
</script>

{#if loading && !breakdown}
  <div class="flex h-[160px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
    <Loader size={20} />
  </div>
{:else if lockoutMessage}
  <ScoreCard
    score={null}
    label="Match Score"
    teaser={{
      title: 'Fit Profile necessário',
      body: lockoutMessage,
      cta: { label: 'Responder questionário', href: '/my-profile/fit-profile/questions' },
    }}
  />
{:else if errorMessage}
  <ScoreCard
    score={null}
    label="Match Score"
    teaser={{
      title: 'Não foi possível calcular',
      body: errorMessage,
    }}
  />
{:else if breakdown}
  <ScoreCard
    score={breakdown.overall}
    label="Match Score"
    description="Keyword + requirements + semantic + fit"
    subScores={[
      { label: 'Palavras-chave', score: breakdown.subs.keyword },
      { label: 'Requisitos', score: breakdown.subs.requirements },
      { label: 'Semântica (IA)', score: breakdown.subs.semantic },
      { label: 'Fit cultural', score: breakdown.subs.fit },
    ]}
  />
{/if}
