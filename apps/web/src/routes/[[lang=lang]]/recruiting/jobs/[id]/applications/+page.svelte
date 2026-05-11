<script lang="ts">
  /**
   * Recruiting jobs/[id]/applications — burra: lista candidaturas para a vaga.
   */
  import { createGetV1JobsIdApplications } from 'api-client';
  import { ArrowLeft } from 'lucide-svelte';
  import { Avatar, Loader } from 'ui';
  import { page } from '$app/stores';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);
  const jobId = $derived($page.params.id ?? '');

  const query = createGetV1JobsIdApplications(() => jobId,
    { page: 1, limit: 100 },
    { query: { enabled: () => !!jobId } },
  );

  const items = $derived($query.data?.items);
  const total = $derived($query.data?.total ?? 0);

  const STATUS_LABEL: Record<string, string> = {
    SUBMITTED: 'Enviadas',
    VIEWED: 'Visualizadas',
    INTERVIEW: 'Entrevista',
    OFFER: 'Oferta',
    HIRED: 'Contratadas',
    REJECTED: 'Rejeitadas',
  };
</script>

<svelte:head>
  <title>{t('company.applications.pageTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 px-3 sm:px-6">
  <header class="flex items-center gap-3">
    <a
      href="/recruiting/jobs"
      class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200"
    >
      <ArrowLeft size={12} />
      {t('company.applications.backToJobs')}
    </a>
  </header>

  <h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
    {t('company.applications.title')}
  </h1>
  <p class="text-sm text-gray-500 dark:text-neutral-400">
    {total} {t('company.applications.received')}
  </p>

  {#if $query.isLoading}
    <div class="flex items-center justify-center py-20"><Loader size={20} /></div>
  {:else if !items || items.length === 0}
    <p class="text-sm text-gray-500 dark:text-neutral-400">{t('company.applications.empty')}</p>
  {:else}
    <ul class="grid gap-2">
      {#each items as a (a.id)}
        <li
          class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-800/50"
        >
          <div class="flex items-center gap-3 min-w-0">
            <Avatar
              photoURL={a.user?.photoURL ?? null}
              name={a.user?.name ?? '?'}
              size="sm"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-neutral-100">
                {a.user?.name ?? t('company.applications.anonymous')}
              </p>
              <p class="truncate text-xs text-gray-500 dark:text-neutral-400">
                {a.createdAt}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
              {STATUS_LABEL[a.status] ?? a.status}
            </span>
            {#if a.user?.username}
              <a
                href={`/my-profile/public/@${a.user.username}`}
                class="text-xs text-primary hover:underline"
              >
                {t('company.applications.viewProfile')}
              </a>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
