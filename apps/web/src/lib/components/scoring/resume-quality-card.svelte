<script lang="ts">
  import { browser } from '$app/environment';
  import { createResumeQualityGet } from 'api-client';
  import { ScoreCard } from 'ui';

  type Props = {
    resumeId: string;
    /** Link the teaser / header to a details page when set. */
    detailsHref?: string;
  };

  let { resumeId, detailsHref }: Props = $props();

  const qualityQuery = createResumeQualityGet(
    () => resumeId,
    () => ({ query: { enabled: browser && !!resumeId, refetchOnWindowFocus: false } }),
  );

  const snapshot = $derived(qualityQuery.data ?? null);
  const issuesCount = $derived(snapshot?.issues?.length ?? 0);
  const highSeverity = $derived(
    (snapshot?.issues ?? []).filter((i: { severity: string }) => i.severity === 'high').length,
  );
</script>

{#if qualityQuery.isPending}
  <div class="h-[160px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"></div>
{:else if snapshot === null || qualityQuery.isError}
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
      description="Completude + qualidade de conteúdo"
      subScores={[
        { label: 'Completude', score: snapshot.completenessScore },
        { label: 'Conteúdo (IA)', score: snapshot.contentQualityScore },
      ]}
    />
    {#if issuesCount > 0}
      <div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900/70">
        <span class="text-neutral-600 dark:text-neutral-300">
          {issuesCount} {issuesCount === 1 ? 'recomendação' : 'recomendações'}
          {#if highSeverity > 0}
            <span class="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700 dark:bg-red-900/40 dark:text-red-200">
              {highSeverity} alta
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

