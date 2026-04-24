<script lang="ts">
  import { createFitProfileMe, createResumesGetAllUserResumes } from 'api-client';
  import { ArrowRight } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import ResumeQualityCard from '$lib/components/scoring/resume-quality-card.svelte';
  import { useAuth } from '$lib/state/auth.svelte';
  import { ScoreCard } from 'ui';

  const auth = useAuth();
  const currentUserId = $derived(String(auth.data?.user?.id ?? ''));

  /** Primary resume id — the hub's scores are anchored to the user's
   *  first resume. Future iteration can add a picker for multi-resume
   *  users. */
  const myResumesQuery = createResumesGetAllUserResumes(
    () => ({ userId: currentUserId, page: 1, limit: 1 }),
    () => ({ query: { enabled: browser && !!currentUserId, retry: false } }),
  );
  const primaryResumeId = $derived<string | null>(
    myResumesQuery.data &&
      typeof myResumesQuery.data === 'object' &&
      'data' in myResumesQuery.data &&
      Array.isArray((myResumesQuery.data as { data: unknown[] }).data) &&
      (myResumesQuery.data as { data: Array<{ id?: string }> }).data.length > 0
      ? ((myResumesQuery.data as { data: Array<{ id?: string }> }).data[0]?.id ?? null)
      : null,
  );

  /** Fit Profile status — decides whether Match Score is available
   *  vs teased. Match Score itself is per-job, so this hub only shows
   *  "available / expired / never" with a link to /careers/browse-jobs. */
  const fitMeQuery = createFitProfileMe(() => ({
    query: { enabled: browser && !!currentUserId, retry: false },
  }));
  const fitStatus = $derived<'responded' | 'expired' | 'never' | 'loading'>(
    fitMeQuery.isPending
      ? 'loading'
      : ((fitMeQuery.data?.status as 'responded' | 'expired' | 'never' | undefined) ?? 'never'),
  );
</script>

<section class="mx-auto max-w-4xl space-y-6 p-6">
  <header>
    <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
      Seus scores
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
          label="Resume Quality"
          teaser={{
            title: 'Sem currículo',
            body: 'Crie seu primeiro currículo pra começar a receber pontuação.',
            cta: { label: 'Criar currículo', href: '/careers/manage-resumes' },
          }}
        />
      {/if}
    </div>

    <!-- Match Score — availability-only teaser; the per-job breakdown
         lives on each job detail page. -->
    <ScoreCard
      score={null}
      label="Match Score"
      description="Calculado por vaga"
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
            ? { label: 'Buscar vagas', href: '/careers/browse-jobs' }
            : { label: 'Responder questionário', href: '/my-profile/fit-profile/questions' },
      }}
    />

    <!-- Style Score — atomic score of the user's active ResumeStyle.
         For v1 we show a "pick a style" teaser; the picker at
         /my-profile/styles (Phase 4.4) will replace this with the
         active style's live styleScore. -->
    <ScoreCard
      score={null}
      label="Style Score"
      description="Estilo visual ativo"
      teaser={{
        title: 'Escolha um estilo',
        body: 'Todos os estilos do sistema são ATS-safe por design. Veja o catálogo e aplique no seu currículo.',
        cta: { label: 'Ver estilos', href: '/my-profile/styles' },
      }}
    />
  </div>

  <div class="rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
    <h2 class="font-semibold">Como os scores se encaixam</h2>
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
      Ver status do Fit Profile <ArrowRight size={12} />
    </a>
  </div>
</section>
