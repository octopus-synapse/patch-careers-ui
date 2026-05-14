<script lang="ts">
  /**
   * /my-profile/scores — burra: hub que mostra Resume Quality + Match Score
   * + Style Score.
   */
  import { createGetV1FitProfileMe, createGetV1Resumes } from 'api-client';
  import { ArrowRight } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import ResumeQualityCard from '$lib/components/scoring/resume-quality-card.svelte';
  import { Card, ScoreCard } from 'ui';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);

  const myResumesQuery = createGetV1Resumes(
    { page: 1, limit: 1 },
    { query: { enabled: () => browser, retry: false } },
  );
  const primaryResumeId = $derived<string | null>(
    $myResumesQuery.data?.items?.[0]?.id ?? null,
  );

  const fitMeQuery = createGetV1FitProfileMe({
      query: { enabled: browser, retry: false },
    });
  const fitStatus = $derived<'responded' | 'expired' | 'never' | 'loading'>(
    $fitMeQuery.isPending ? 'loading' : ($fitMeQuery.data?.status ?? 'never'),
  );
</script>

<section class="mx-auto max-w-4xl space-y-6 p-6">
  <header>
    <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
      {t('myProfile.scores.heading')}
    </h1>
    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
      Um painel das três dimensões que a plataforma rankeia: Style, Resume Quality e Match.
    </p>
  </header>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <!-- Resume Quality — reuses the edit-page card -->
    <div>
      {#if primaryResumeId}
        <ResumeQualityCard resumeId={primaryResumeId} detailsHref="/my-profile/scores" />
      {:else}
        <ScoreCard
          score={null}
          label={t('myProfile.scores.resumeQualityLabel')}
          teaser={{
            title: t('myProfile.scores.noResumeTitle'),
            body: 'Crie seu primeiro currículo pra começar a receber pontuação.',
            cta: { label: t('myProfile.scores.noResumeCta'), href: '/careers/manage-resumes' },
          }}
        />
      {/if}
    </div>

    <!-- Match Score — availability-only teaser; the per-job breakdown
         lives on each job detail page. -->
    <ScoreCard
      score={null}
      label={t('myProfile.scores.matchScoreLabel')}
      description={t('myProfile.scores.matchScoreDescription')}
      teaser={{
        title:
          fitStatus === 'responded'
            ? 'Explore as vagas'
            : fitStatus === 'expired'
              ? 'Seu Fit Profile expirou'
              : 'Fit Profile necessário',
        body:
          fitStatus === 'responded'
            ? 'Cada vaga mostra o seu Match Score com breakdown keyword, requisitos, semântica e fit.'
            : fitStatus === 'expired'
              ? 'Refaça o questionário de 25 perguntas pra reativar o match.'
              : 'Responda o questionário de 25 perguntas pra liberar o Match Score.',
        cta:
          fitStatus === 'responded'
            ? { label: t('myProfile.scores.browseJobsCta'), href: '/careers/browse-jobs' }
            : { label: t('myProfile.scores.answerQuestionnaireCta'), href: '/my-profile/fit-profile/questions' },
      }}
    />

    <!-- Style Score — atomic score of the user's active ResumeStyle.
         For v1 we show a "pick a style" teaser; the picker at
         /my-profile/styles (Phase 4.4) will replace this with the
         active style's live styleScore. -->
    <ScoreCard
      score={null}
      label={t('myProfile.scores.styleScoreLabel')}
      description={t('myProfile.scores.styleScoreDescription')}
      teaser={{
        title: t('myProfile.scores.pickStyleTitle'),
        body: 'Todos os estilos do sistema são ATS-safe por design. Veja o catálogo e aplique no seu currículo.',
        cta: { label: t('myProfile.scores.seeStylesCta'), href: '/my-profile/styles' },
      }}
    />
  </div>

  <Card class="text-sm">
    <h2 class="font-semibold">{t('myProfile.scores.howTheyFitHeading')}</h2>
    <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
      Quality mede o seu currículo sozinho. Style mede o estilo visual
      aplicado ao currículo. Match combina os dois com o perfil da vaga
      e o seu Fit Profile comportamental. Os três são independentes — e
      juntos dão uma leitura completa da sua prontidão.
    </p>
    <a
      href="/my-profile/fit-profile"
      class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
    >
      {t('myProfile.scores.fitProfileStatusLink')} <ArrowRight size={12} />
    </a>
  </Card>
</section>
