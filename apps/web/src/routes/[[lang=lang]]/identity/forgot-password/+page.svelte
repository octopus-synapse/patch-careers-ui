<script lang="ts">
import { createPostV1AuthForgotPassword } from 'api-client';

import { Button, Input, Label, Loader } from 'ui';

let email = $state('');
let sent = $state(false);
let error = $state<string | null>(null);

const forgotPassword = createPostV1AuthForgotPassword({
  mutation: {
    onSuccess() {
      sent = true;
    },
    onError() {
      error = 'Não foi possível enviar o email. Tente novamente.';
    },
  },
});

function handleSubmit(e: Event) {
  e.preventDefault();
  if (!email || $forgotPassword.isPending) return;
  error = null;
  $forgotPassword.mutate({ data: { email } });
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
        <Button type="submit" disabled={$forgotPassword.isPending} variant="solid">
          {#if $forgotPassword.isPending}
            <Loader size={14} class="mx-auto" />
          {:else}
            Enviar link de recuperação
          {/if}
        </Button>
        <div class="text-center">
          <a href="/identity/sign-in" class="text-xs text-gray-500 hover:underline dark:text-neutral-500">
            Voltar ao login
          </a>
        </div>
      </form>
    {/if}
  </div>
</main>
