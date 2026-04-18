<script lang="ts">
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
  try {
    const res = await fetch('/api/auth/session/create-from-oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, provider }),
      credentials: 'include',
    });
    if (!res.ok) {
      error = 'Falha ao finalizar login. Tente novamente.';
      return;
    }
    goto('/dashboard');
  } catch {
    error = 'Erro de rede ao finalizar login.';
  }
});
</script>

<svelte:head>
  <title>Finalizando login · Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6" role="status" aria-live="polite">
  <div class="text-center">
    {#if error}
      <p class="text-sm text-red-500/80" role="alert">{error}</p>
      <a href="/login" class="mt-4 inline-block text-xs text-gray-500 hover:underline">
        Voltar ao login
      </a>
    {:else}
      <Loader2 size={24} class="mx-auto animate-spin text-gray-500" />
      <p class="mt-3 text-sm text-gray-500">Finalizando login…</p>
    {/if}
  </div>
</main>
