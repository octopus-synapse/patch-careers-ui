<script lang="ts">
  /**
   * Recruiting search-candidates — burra: descreve vaga, recebe ranking.
   * Backend retorna `void` no schema OpenAPI; cast local da resposta.
   */
  import {
    recruitingMatchCandidates,
    type RecruitingMatchCandidatesMutationRequest,
  } from 'api-client';
  import { Sparkles, Users } from 'lucide-svelte';
  import { Avatar, Badge, Button, Input, Label, Loader, Textarea, toastState } from 'ui';
  import { goto } from '$app/navigation';

  type Candidate = {
    userId: string;
    username?: string | null;
    name?: string | null;
    photoURL?: string | null;
    bio?: string | null;
    primaryStack?: string[];
    fit?: {
      score?: number;
      breakdown?: {
        matchedSkills?: string[];
        missingSkills?: string[];
        englishMatch?: string;
        remoteMatch?: string;
      };
    };
  };

  type Response = { candidates?: Candidate[] };

  let jobTitle = $state('');
  let jobDescription = $state('');
  let skillsCsv = $state('');
  let minEnglishLevel = $state<'' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'FLUENT'>('');
  let remotePolicy = $state<'' | 'REMOTE' | 'HYBRID' | 'ONSITE'>('');
  let limit = $state(10);

  let submitting = $state(false);
  let candidates = $state<Candidate[]>([]);
  let searched = $state(false);

  const skills = $derived(
    skillsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const canSubmit = $derived(skills.length > 0 || jobDescription.trim().length > 0);

  async function handleSearch() {
    if (!canSubmit || submitting) return;
    submitting = true;
    try {
      const payload: RecruitingMatchCandidatesMutationRequest = {
        jobTitle: jobTitle || undefined,
        jobDescription: jobDescription || undefined,
        skills: skills.length > 0 ? skills : undefined,
        minEnglishLevel: minEnglishLevel || undefined,
        remotePolicy: remotePolicy || undefined,
        limit,
      };
      const res = (await recruitingMatchCandidates(payload)) as unknown as Response;
      candidates = res?.candidates ?? [];
      searched = true;
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Falha ao buscar candidatos';
      toastState.show(message, 'danger');
    } finally {
      submitting = false;
    }
  }

  function viewProfile(username: string | null | undefined, userId: string) {
    if (username) goto(`/my-profile/public/@${username}`);
    else goto(`/users/${userId}`);
  }
</script>

<svelte:head>
  <title>Buscar candidatos · patch-careers</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-6 px-4 pb-12 pt-20">
  <header class="space-y-1">
    <div class="flex items-center gap-2 text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400">
      <Sparkles size={14} />
      Match reverso
    </div>
    <h1 class="text-xl font-semibold text-gray-800 dark:text-neutral-200">
      Descreva a vaga, a gente ranqueia candidatos
    </h1>
    <p class="text-sm text-gray-500 dark:text-neutral-500">
      Só aparecem aqui quem optou por perfil público ou compartilhável. Candidatos privados nunca entram no pool.
    </p>
  </header>

  <section class="rounded-xl border border-gray-200 p-4 dark:border-neutral-700/60">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label>Título da vaga</Label>
        <Input bind:value={jobTitle} placeholder="ex: Senior Full-Stack Engineer" />
      </div>
      <div>
        <Label>Skills (separadas por vírgula)</Label>
        <Input bind:value={skillsCsv} placeholder="react, typescript, postgres" />
      </div>
    </div>

    <div class="mt-3">
      <Label>Descrição completa</Label>
      <Textarea
        rows={5}
        bind:value={jobDescription}
        placeholder="Cole a JD aqui — fica usada para contexto. Skills vêm do campo acima."
      />
    </div>

    <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <Label>Inglês mínimo</Label>
        <select
          bind:value={minEnglishLevel}
          class="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
        >
          <option value="">Qualquer</option>
          <option value="BASIC">Básico</option>
          <option value="INTERMEDIATE">Intermediário</option>
          <option value="ADVANCED">Avançado</option>
          <option value="FLUENT">Fluente</option>
        </select>
      </div>
      <div>
        <Label>Regime</Label>
        <select
          bind:value={remotePolicy}
          class="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
        >
          <option value="">Qualquer</option>
          <option value="REMOTE">Remoto</option>
          <option value="HYBRID">Híbrido</option>
          <option value="ONSITE">Presencial</option>
        </select>
      </div>
      <div>
        <Label>Qtd. resultados</Label>
        <select
          bind:value={limit}
          class="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={25}>Top 25</option>
        </select>
      </div>
    </div>

    <div class="mt-4 flex justify-end">
      <Button variant="solid" size="sm" onclick={handleSearch} disabled={!canSubmit || submitting}>
        {#if submitting}
          <Loader size={14} /> Buscando…
        {:else}
          <Users size={14} /> Buscar candidatos
        {/if}
      </Button>
    </div>
  </section>

  <section>
    {#if searched && candidates.length === 0}
      <div
        class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-neutral-500"
      >
        Nenhum candidato bateu com o perfil descrito. Tente afrouxar os filtros (inglês, regime) ou revisar as skills.
      </div>
    {:else if candidates.length > 0}
      <div class="space-y-3">
        {#each candidates as c (c.userId)}
          <article class="flex items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-neutral-700/60">
            <Avatar
              name={c.name ?? c.username ?? '?'}
              photoURL={c.photoURL ?? undefined}
              size="lg"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-gray-800 dark:text-neutral-200">
                  {c.name ?? c.username ?? 'Candidato'}
                </span>
                {#if c.username}
                  <span class="text-xs text-gray-400 dark:text-neutral-500">@{c.username}</span>
                {/if}
                {#if c.fit?.score !== undefined}
                  <span class="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                    {Math.round((c.fit.score ?? 0) * 100)}% fit
                  </span>
                {/if}
              </div>
              {#if c.bio}
                <p class="mt-1 text-xs text-gray-600 dark:text-neutral-400">{c.bio}</p>
              {/if}
              {#if c.primaryStack && c.primaryStack.length > 0}
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each c.primaryStack.slice(0, 8) as s}
                    <Badge intent="neutral" size="md">{s}</Badge>
                  {/each}
                  {#if c.primaryStack.length > 8}
                    <span class="text-[10px] text-gray-500 dark:text-neutral-500">
                      +{c.primaryStack.length - 8}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>
            <Button variant="outline" size="xs" onclick={() => viewProfile(c.username, c.userId)}>
              Ver perfil
            </Button>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</main>
