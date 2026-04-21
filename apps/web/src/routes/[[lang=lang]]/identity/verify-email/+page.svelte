<script lang="ts">
import { CheckCircle2, Loader2, XCircle } from 'lucide-svelte';
import { onMount } from 'svelte';
import { page } from '$app/stores';

const token = $derived($page.url.searchParams.get('token') ?? '');

let status = $state<'verifying' | 'success' | 'error'>('verifying');
let message = $state('');

onMount(async () => {
  if (!token) {
    status = 'error';
    message = 'Token de verificação ausente.';
    return;
  }
  try {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      status = 'success';
      message = 'Email verificado com sucesso.';
    } else {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      status = 'error';
      message = body?.message ?? 'Link inválido ou expirado.';
    }
  } catch {
    status = 'error';
    message = 'Erro de rede ao verificar.';
  }
});
</script>

<svelte:head>
  <title>Verificar email · Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6">
  <div class="w-full max-w-[360px] text-center" role="status" aria-live="polite">
    {#if status === 'verifying'}
      <Loader2 class="mx-auto mb-4 h-6 w-6 animate-spin text-gray-500" />
      <p class="text-sm text-gray-500 dark:text-neutral-500">Verificando seu email…</p>
    {:else if status === 'success'}
      <CheckCircle2 class="mx-auto mb-4 h-8 w-8 text-emerald-500" />
      <h1 class="text-lg font-medium text-gray-800 dark:text-neutral-200">{message}</h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-neutral-500">
        <a href="/my-profile/dashboard" class="font-medium text-cyan-500 hover:underline">Ir para o dashboard →</a>
      </p>
    {:else}
      <XCircle class="mx-auto mb-4 h-8 w-8 text-red-500" />
      <h1 class="text-lg font-medium text-gray-800 dark:text-neutral-200">Não foi possível verificar</h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-neutral-500">{message}</p>
      <p class="mt-4 text-sm">
        <a href="/identity/sign-in" class="font-medium text-cyan-500 hover:underline">Voltar ao login</a>
      </p>
    {/if}
  </div>
</main>
