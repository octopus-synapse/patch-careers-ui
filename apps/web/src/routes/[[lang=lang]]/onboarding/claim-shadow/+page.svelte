<!--
  Shadow profile claim — when a user signs up and we already have a public-data
  profile pre-built for them (typically GitHub), let them adopt that data into
  their fresh account in one click instead of redoing onboarding.
-->
<script lang="ts">
import { createShadowProfileCandidates, createShadowProfileClaim } from 'api-client';
import { Check, X } from 'lucide-svelte';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { Button, Card, Loader, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

const queryParams = $derived.by(() => {
  const githubLogin = $page.url.searchParams.get('githubLogin');
  const email = $page.url.searchParams.get('email');
  const params: { githubLogin?: string; email?: string } = {};
  if (githubLogin) params.githubLogin = githubLogin;
  if (email) params.email = email;
  return params;
});

const candidatesQuery = createShadowProfileCandidates(queryParams, {
  query: { enabled: browser },
});

// Bounce straight to dashboard if there's nothing to claim.
$effect(() => {
  const data = $candidatesQuery.data;
  if (data && data.candidates.length === 0) goto('/my-profile/dashboard');
});

$effect(() => {
  if ($candidatesQuery.isError) {
    handleApiError($candidatesQuery.error);
    goto('/my-profile/dashboard');
  }
});

const claimMutation = createShadowProfileClaim({
  mutation: {
    onSuccess: () => {
      toastState.show('Perfil reivindicado. Adicionamos os dados ao seu currículo.', 'success');
      goto('/my-profile/dashboard');
    },
    onError: handleApiError,
  },
});

let claimingId = $state<string | null>(null);

function claim(id: string) {
  claimingId = id;
  $claimMutation.mutate({ id }, { onSettled: () => (claimingId = null) });
}

function skip() {
  goto('/my-profile/dashboard');
}
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

  {#if $candidatesQuery.isLoading}
    <div class="flex justify-center py-12">
      <Loader size={20} />
    </div>
  {:else if $candidatesQuery.data}
    <ul class="space-y-4">
      {#each $candidatesQuery.data.candidates as cand (cand.id)}
        <Card>
          <header class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                {cand.source} · @{cand.externalHandle}
              </p>
              {#if cand.contactEmail}
                <p class="mt-1 text-xs text-gray-600 dark:text-neutral-400">{cand.contactEmail}</p>
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
                disabled={claimingId === cand.id}
              >
                {#if claimingId === cand.id}
                  <Loader size={14} class="mr-2" />
                {:else}
                  <Check size={14} class="mr-2" />
                {/if}
                Reivindicar
              </Button>
            </div>
          </header>
        </Card>
      {/each}
    </ul>
  {/if}
</div>
