<script lang="ts">
import { createPostV1AuthForgotPassword } from 'api-client';
import { postV1AuthForgotPasswordMutationRequestSchema } from 'api-client/zod';

import { Button, Input, Label, Loader } from 'ui';
import { createForm } from '$lib/state/create-form.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

let sent = $state(false);
let serverError = $state<string | null>(null);

const forgotPassword = createPostV1AuthForgotPassword({
  mutation: {
    onSuccess() {
      sent = true;
    },
    onError() {
      serverError = 'Não foi possível enviar o email. Tente novamente.';
    },
  },
});

const form = createForm({
  schema: postV1AuthForgotPasswordMutationRequestSchema,
  initial: { email: '' },
  mutation: forgotPassword,
});

function handleSubmit(e: Event) {
  e.preventDefault();
  serverError = null;
  form.submit();
}
</script>

<svelte:head>
  <title>Esqueci minha senha · Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6">
  <div class="w-full max-w-[360px]">
    <div class="mb-10">
      <h1 class="text-xl font-medium tracking-tight text-gray-800 dark:text-neutral-200">
        {t('identity.forgotPassword.heading')}
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
            bind:value={form.values.email}
            required
            placeholder={t('identity.forgotPassword.emailPlaceholder')}
          />
          {#if form.errors.email}
            <p class="text-xs font-medium text-red-500/80" role="alert">{form.errors.email}</p>
          {/if}
        </div>
        {#if serverError}
          <p class="text-xs font-medium text-red-500/80" role="alert">{serverError}</p>
        {/if}
        <Button type="submit" disabled={form.isSubmitting} variant="solid">
          {#if form.isSubmitting}
            <Loader size={14} class="mx-auto" />
          {:else}
            Enviar link de recuperação
          {/if}
        </Button>
        <div class="text-center">
          <a href="/identity/sign-in" class="text-xs text-gray-500 hover:underline dark:text-neutral-500">
            {t('identity.forgotPassword.backToLogin')}
          </a>
        </div>
      </form>
    {/if}
  </div>
</main>
