<script lang="ts">
import { Loader2 } from 'lucide-svelte';
import { Button, Input, Label } from 'ui';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

const token = $derived($page.url.searchParams.get('token') ?? '');

let password = $state('');
let confirm = $state('');
let submitting = $state(false);
let error = $state<string | null>(null);
let success = $state(false);

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!token) {
    error = 'Token ausente. Solicite um novo link de recuperação.';
    return;
  }
  if (password.length < 8) {
    error = 'A senha precisa ter pelo menos 8 caracteres.';
    return;
  }
  if (password !== confirm) {
    error = 'As senhas não coincidem.';
    return;
  }
  submitting = true;
  error = null;
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      error = body?.message ?? 'Não foi possível redefinir. O link pode ter expirado.';
      return;
    }
    success = true;
    setTimeout(() => goto('/login'), 1500);
  } catch {
    error = 'Erro de rede. Tente novamente.';
  } finally {
    submitting = false;
  }
}
</script>

<svelte:head>
  <title>Redefinir senha · Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6">
  <div class="w-full max-w-[360px]">
    <div class="mb-10">
      <h1 class="text-xl font-medium tracking-tight text-gray-800 dark:text-neutral-200">
        Redefinir senha
      </h1>
      <p class="text-sm text-gray-500 dark:text-neutral-500">Escolha uma senha nova e segura.</p>
    </div>

    {#if success}
      <div
        class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300"
        role="status"
      >
        Senha redefinida com sucesso. Redirecionando para o login…
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="space-y-6" novalidate>
        <div>
          <Label for="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            bind:value={password}
            required
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <Label for="confirm">Confirmar senha</Label>
          <Input id="confirm" type="password" bind:value={confirm} required />
        </div>
        {#if error}
          <p class="text-xs font-medium text-red-500/80" role="alert">{error}</p>
        {/if}
        <Button type="submit" disabled={submitting} variant="solid">
          {#if submitting}
            <Loader2 size={14} class="mx-auto animate-spin" />
          {:else}
            Redefinir senha
          {/if}
        </Button>
      </form>
    {/if}
  </div>
</main>
