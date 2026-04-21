<!--
  Shadow profile claim — when a user signs up and we already have a public-data
  profile pre-built for them (typically GitHub), let them adopt that data into
  their fresh account in one click instead of redoing onboarding.
-->
<script lang="ts">
import { Check, Loader2, X } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, Card, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

interface ShadowCandidate {
  id: string;
  source: string;
  externalHandle: string;
  payload: {
    headline?: string | null;
    primaryStack?: string[];
    projects?: Array<{ name: string; url: string; summary: string }>;
    stats?: { totalRepos?: number; nonForkRepos?: number; totalStars?: number };
  };
}

let loading = $state(true);
let candidates = $state<ShadowCandidate[]>([]);
let claiming = $state<string | null>(null);

async function load() {
  if (!browser) return;
  loading = true;
  try {
    const params = new URLSearchParams();
    const githubLogin = $page.url.searchParams.get('githubLogin');
    const email = $page.url.searchParams.get('email');
    if (githubLogin) params.set('githubLogin', githubLogin);
    if (email) params.set('email', email);
    const res = await fetch(`/api/v1/shadow-profiles/candidates?${params}`, {
      credentials: 'include',
    });
    const body = (await res.json()) as { data?: { candidates?: ShadowCandidate[] } };
    candidates = body.data?.candidates ?? [];
    if (candidates.length === 0) {
      // Nothing to claim — bounce straight to dashboard.
      goto('/my-profile/dashboard');
    }
  } catch {
    toastState.show('Falha ao buscar perfis pré-montados.', 'danger');
    goto('/my-profile/dashboard');
  } finally {
    loading = false;
  }
}

async function claim(id: string) {
  claiming = id;
  try {
    const res = await fetch(`/api/v1/shadow-profiles/${id}/claim`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    toastState.show('Perfil reivindicado. Adicionamos os dados ao seu currículo.', 'success');
    goto('/my-profile/dashboard');
  } catch {
    toastState.show('Falha ao reivindicar perfil.', 'danger');
  } finally {
    claiming = null;
  }
}

function skip() {
  goto('/my-profile/dashboard');
}

onMount(load);
</script>

<svelte:head>
  <title>Encontramos seu perfil · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <div class="mb-5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-800 dark:text-cyan-300">
    Criamos um rascunho quando você conectou LinkedIn ou GitHub. Revise e confirme — dá pra
    editar tudo depois.
  </div>
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
      Encontramos um perfil pra você
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Já tínhamos dados públicos seus indexados. Reivindique pra começar com um currículo
      pré-preenchido — ou ignore e comece do zero.
    </p>
  </header>

  {#if loading}
    <div class="flex justify-center py-12">
      <Loader2 size={20} class="animate-spin text-gray-500" />
    </div>
  {:else}
    <ul class="space-y-4">
      {#each candidates as cand (cand.id)}
        <Card>
          <header class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                {cand.source} · @{cand.externalHandle}
              </p>
              {#if cand.payload.headline}
                <p class="mt-1 text-xs text-gray-600 dark:text-neutral-400">
                  {cand.payload.headline}
                </p>
              {/if}
            </div>
            <div class="flex gap-2">
              <Button variant="ghost" size="sm" onclick={skip}>
                <X size={14} />
                Ignorar
              </Button>
              <Button
                variant="solid"
                size="sm"
                onclick={() => claim(cand.id)}
                disabled={claiming === cand.id}
              >
                {#if claiming === cand.id}
                  <Loader2 size={14} class="mr-2 animate-spin" />
                {:else}
                  <Check size={14} class="mr-2" />
                {/if}
                Reivindicar
              </Button>
            </div>
          </header>

          {#if cand.payload.primaryStack && cand.payload.primaryStack.length > 0}
            <div class="mt-3">
              <p class="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Stack principal</p>
              <div class="flex flex-wrap gap-1">
                {#each cand.payload.primaryStack as skill}
                  <span class="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {skill}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          {#if cand.payload.stats}
            <p class="mt-3 text-[11px] text-gray-500 dark:text-neutral-500">
              {cand.payload.stats.nonForkRepos ?? 0} repos · {cand.payload.stats.totalStars ?? 0} ★
            </p>
          {/if}

          {#if cand.payload.projects && cand.payload.projects.length > 0}
            <details class="mt-3">
              <summary class="cursor-pointer text-xs text-cyan-600 hover:underline">
                Ver {cand.payload.projects.length} projetos
              </summary>
              <ul class="mt-2 space-y-1 text-xs text-gray-700 dark:text-neutral-300">
                {#each cand.payload.projects as p}
                  <li>
                    <a href={p.url} target="_blank" rel="noopener" class="text-cyan-600 hover:underline">
                      {p.name}
                    </a>
                    — {p.summary}
                  </li>
                {/each}
              </ul>
            </details>
          {/if}
        </Card>
      {/each}
    </ul>
  {/if}
</div>
