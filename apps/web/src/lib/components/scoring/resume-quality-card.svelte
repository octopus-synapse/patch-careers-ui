<script lang="ts">
  import { browser } from '$app/environment';
  import { createGetV1ResumesResumeIdQuality } from 'api-client';
  import { Badge, ScoreCard, Skeleton } from 'ui';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);

  /**
   * Resume Quality card — frontend-burro: backend ships an `overallScore`,
   * sub-scores (`completenessScore`, `contentQualityScore`) and an `issues`
   * list. Severity highlight uses the backend's `high` label.
   *
   * Endpoint: GET /api/v1/resume-quality/resumes/:id/quality.
   */

  type Props = {
    resumeId: string;
    /** Link the teaser / header to a details page when set. */
    detailsHref?: string;
  };

  let { resumeId, detailsHref }: Props = $props();

  const qualityQuery = createGetV1ResumesResumeIdQuality(() => resumeId,
    { query: { enabled: () => browser && !!resumeId, refetchOnWindowFocus: false } },
  );

  const snapshot = $derived($qualityQuery.data);
  const issuesCount = $derived(snapshot?.issues.length ?? 0);
  const highSeverity = $derived(
    snapshot ? snapshot.issues.filter((i) => i.severity === 'high').length : 0,
  );
  const subScores = $derived(
    snapshot
      ? [
          { label: 'Completeness', score: snapshot.completenessScore },
          { label: 'Content', score: snapshot.contentQualityScore },
        ]
      : [],
  );
</script>

{#if $qualityQuery.isPending}
  <Skeleton height="160px" class="rounded-xl" />
{:else if !snapshot || $qualityQuery.isError}
  <ScoreCard
    score={null}
    label={t('scoring.resumeQualityLabel')}
    teaser={{
      title: t('scoring.noSnapshotTitle'),
      body: 'Salve uma mudança no currículo para gerar sua primeira pontuação.',
      cta: detailsHref ? { label: t('scoring.viewDetails'), href: detailsHref } : undefined,
    }}
  />
{:else}
  <div class="space-y-2">
    <ScoreCard
      score={snapshot.overallScore}
      label={t('scoring.resumeQualityLabel')}
      subScores={subScores}
    />
    {#if issuesCount > 0}
      <div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900/70">
        <span class="text-neutral-600 dark:text-neutral-300">
          {issuesCount} {issuesCount === 1 ? 'recomendação' : 'recomendações'}
          {#if highSeverity > 0}
            <span class="ml-1 inline-block uppercase">
              <Badge intent="danger" size="sm">{highSeverity} alta</Badge>
            </span>
          {/if}
        </span>
        {#if detailsHref}
          <a
            href={detailsHref}
            class="font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
          >
            {t('scoring.viewList')}
          </a>
        {/if}
      </div>
    {/if}
  </div>
{/if}
