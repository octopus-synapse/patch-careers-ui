<script lang="ts">
import { createPostV1AuthResetPassword, isApiError } from 'api-client';
import { postV1AuthResetPasswordMutationRequestSchema } from 'api-client/zod';
import { Button, Input, Label, Loader } from 'ui';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { createForm } from '$lib/state/create-form.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const token = $derived($page.url.searchParams.get('token') ?? '');

let confirm = $state('');
let confirmError = $state('');
let serverError = $state<string | null>(null);
let success = $state(false);

const reset = createPostV1AuthResetPassword({
  mutation: {
    onSuccess() {
      success = true;
      setTimeout(() => goto('/identity/sign-in'), 1500);
    },
    onError(err: unknown) {
      if (isApiError(err)) serverError = err.message;
    },
  },
});

const form = createForm({
  schema: postV1AuthResetPasswordMutationRequestSchema,
  initial: { token: '', newPassword: '' },
  mutation: reset,
  transform: (v) => ({ ...v, token }),
});

function handleSubmit(e: Event) {
  e.preventDefault();
  serverError = null;
  confirmError = '';
  if (!token) {
    serverError = 'Token ausente. Solicite um novo link de recuperação.';
    return;
  }
  if (form.values.newPassword !== confirm) {
    confirmError = 'As senhas não coincidem.';
    return;
  }
  form.submit();
}
</script>

<svelte:head>
  <title>Redefinir senha · Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6">
  <div class="w-full max-w-[360px]">
    <div class="mb-10">
      <h1 class="text-xl font-medium tracking-tight text-gray-800 dark:text-neutral-200">
        {t('identity.resetPassword.heading')}
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
          <Label for="password">{t('identity.resetPassword.newPasswordLabel')}</Label>
          <Input
            id="password"
            type="password"
            bind:value={form.values.newPassword}
            required
            placeholder={t('identity.resetPassword.newPasswordPlaceholder')}
          />
          {#if form.errors.newPassword}
            <p class="text-xs font-medium text-red-500/80" role="alert">{form.errors.newPassword}</p>
          {/if}
        </div>
        <div>
          <Label for="confirm">{t('identity.resetPassword.confirmPasswordLabel')}</Label>
          <Input id="confirm" type="password" bind:value={confirm} required />
          {#if confirmError}
            <p class="text-xs font-medium text-red-500/80" role="alert">{confirmError}</p>
          {/if}
        </div>
        {#if serverError}
          <p class="text-xs font-medium text-red-500/80" role="alert">{serverError}</p>
        {/if}
        <Button type="submit" disabled={form.isSubmitting} variant="solid">
          {#if form.isSubmitting}
            <Loader size={14} class="mx-auto" />
          {:else}
            Redefinir senha
          {/if}
        </Button>
      </form>
    {/if}
  </div>
</main>
