<script lang="ts">
import { shadowProfileFindCandidates } from 'api-client';
import { Loader2 } from 'lucide-svelte';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

let error = $state<string | null>(null);

onMount(async () => {
  const userId = $page.url.searchParams.get('userId');
  const provider = $page.url.searchParams.get('provider');
  if (!userId || !provider) {
    error = 'Resposta OAuth inválida.';
    return;
  }

  // Session is already attached by the backend's OAuth callback — no need
  // to post anything here. We only probe for shadow candidates so we can
  // offer the claim flow if we pre-built a profile for this user.
  try {
    const githubLogin = $page.url.searchParams.get('githubLogin') ?? undefined;
    const email = $page.url.searchParams.get('email') ?? undefined;
    if (githubLogin || email) {
      const result = await shadowProfileFindCandidates({ githubLogin, email });
      const candidates = (result as { candidates?: unknown[] })?.candidates ?? [];
      if (candidates.length > 0) {
        const params = new URLSearchParams();
        if (githubLogin) params.set('githubLogin', githubLogin);
        if (email) params.set('email', email);
        goto(`/onboarding/claim-shadow?${params}`);
        return;
      }
    }
  } catch {
    // Candidate probe is an enhancement, not a guard — fall through.
  }

  goto('/my-profile/dashboard');
});
</script>

<svelte:head>
  <title>Finalizando login · Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6" role="status" aria-live="polite">
  <div class="text-center">
    {#if error}
      <p class="text-sm text-red-500/80" role="alert">{error}</p>
      <a href="/identity/sign-in" class="mt-4 inline-block text-xs text-gray-500 hover:underline">
        Voltar ao login
      </a>
    {:else}
      <Loader2 size={24} class="mx-auto animate-spin text-gray-500" />
      <p class="mt-3 text-sm text-gray-500">Finalizando login…</p>
    {/if}
  </div>
</main>
