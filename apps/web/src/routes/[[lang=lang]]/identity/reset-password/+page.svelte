<script lang="ts">
import { createPostV1AuthResetPassword, isApiError } from 'api-client';
import { Button, Input, Label, Loader } from 'ui';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

const token = $derived($page.url.searchParams.get('token') ?? '');

let password = $state('');
let confirm = $state('');
let error = $state<string | null>(null);
let success = $state(false);

const reset = createPostV1AuthResetPassword({
  mutation: {
    onSuccess() {
      success = true;
      setTimeout(() => goto('/identity/sign-in'), 1500);
    },
    onError(err: unknown) {
      if (isApiError(err)) error = err.message;
    },
  },
});

function handleSubmit(e: Event) {
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
  error = null;
  $reset.mutate({ data: { token, newPassword: password } });
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
        <Button type="submit" disabled={$reset.isPending} variant="solid">
          {#if $reset.isPending}
            <Loader size={14} class="mx-auto" />
          {:else}
            Redefinir senha
          {/if}
        </Button>
      </form>
    {/if}
  </div>
</main>
