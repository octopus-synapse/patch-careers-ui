<script lang="ts">
  import { browser } from '$app/environment';
  import { createResumeQualityResumesQuality } from 'api-client';
  import { Badge, ScoreCard, Skeleton } from 'ui';

  /**
   * Resume Quality card — frontend-burro: backend ships a `breakdown`
   * array of `{key, label, value, hint?, severity?}` and an `issues` list.
   * Severity-to-tone mapping lives in the backend; this component only
   * surfaces the count and the high-severity highlight that the backend
   * already labelled "high".
   *
   * Endpoint: GET /api/v1/resume-quality/resumes/:id/quality. The SDK
   * response is `{ data: void }` until the swagger schema lands; we cast
   * to the structural shape.
   */

  type QualityBreakdownEntry = {
    key: string;
    label: string;
    value: number | null;
    hint?: string | null;
    severity?: string | null;
  };

  type QualityIssue = {
    key?: string;
    label?: string;
    severity: string;
    hint?: string | null;
  };

  type QualitySnapshot = {
    overallScore: number;
    breakdown?: QualityBreakdownEntry[];
    issues?: QualityIssue[];
  };

  type Props = {
    resumeId: string;
    /** Link the teaser / header to a details page when set. */
    detailsHref?: string;
  };

  let { resumeId, detailsHref }: Props = $props();

  const qualityQuery = createResumeQualityResumesQuality(
    resumeId,
    { query: { enabled: browser && !!resumeId, refetchOnWindowFocus: false } },
  );

  const snapshot = $derived(
    ($qualityQuery.data ?? null) as unknown as QualitySnapshot | null,
  );
  const issuesCount = $derived(snapshot?.issues?.length ?? 0);
  const highSeverity = $derived(
    (snapshot?.issues ?? []).filter((i) => i.severity === 'high').length,
  );
  const subScores = $derived(
    snapshot?.breakdown?.map((b) => ({ label: b.label, score: b.value })) ?? [],
  );
</script>

{#if $qualityQuery.isPending}
  <Skeleton height="160px" class="rounded-xl" />
{:else if snapshot === null || $qualityQuery.isError}
  <ScoreCard
    score={null}
    label="Resume Quality"
    teaser={{
      title: 'Ainda sem snapshot',
      body: 'Salve uma mudança no currículo para gerar sua primeira pontuação.',
      cta: detailsHref ? { label: 'Ver detalhes', href: detailsHref } : undefined,
    }}
  />
{:else}
  <div class="space-y-2">
    <ScoreCard
      score={snapshot.overallScore}
      label="Resume Quality"
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
            Ver lista →
          </a>
        {/if}
      </div>
    {/if}
  </div>
{/if}
