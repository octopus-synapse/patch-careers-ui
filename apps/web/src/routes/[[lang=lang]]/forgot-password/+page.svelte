<script lang="ts">
import { Loader2 } from 'lucide-svelte';
import { Button, Input, Label } from 'ui';

let email = $state('');
let submitting = $state(false);
let sent = $state(false);
let error = $state<string | null>(null);

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!email || submitting) return;
  submitting = true;
  error = null;
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    // The endpoint always returns success to prevent email enumeration.
    if (!res.ok && res.status !== 200) {
      error = 'Não foi possível enviar o email. Tente novamente.';
    } else {
      sent = true;
    }
  } catch {
    error = 'Erro de rede. Tente novamente.';
  } finally {
    submitting = false;
  }
}
</script>

<svelte:head>
  <title>Esqueci minha senha · Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6">
  <div class="w-full max-w-[360px]">
    <div class="mb-10">
      <h1 class="text-xl font-medium tracking-tight text-gray-800 dark:text-neutral-200">
        Esqueci minha senha
      </h1>
      <p class="text-sm text-gray-500 dark:text-neutral-500">
        Digite seu email e enviaremos um link pra redefinir.
      </p>
    </div>

    {#if sent}
      <div
        class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300"
        role="status"
      >
        Se uma conta com esse email existe, um link de recuperação foi enviado.
        Confira sua caixa de entrada (e spam).
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="space-y-6" novalidate>
        <div>
          <Label for="email">Email</Label>
          <Input
            id="email"
            type="email"
            bind:value={email}
            required
            placeholder="voce@exemplo.com"
          />
        </div>
        {#if error}
          <p class="text-xs font-medium text-red-500/80" role="alert">{error}</p>
        {/if}
        <Button type="submit" disabled={submitting} variant="solid">
          {#if submitting}
            <Loader2 size={14} class="mx-auto animate-spin" />
          {:else}
            Enviar link de recuperação
          {/if}
        </Button>
        <div class="text-center">
          <a href="/login" class="text-xs text-gray-500 hover:underline dark:text-neutral-500">
            Voltar ao login
          </a>
        </div>
      </form>
    {/if}
  </div>
</main>
