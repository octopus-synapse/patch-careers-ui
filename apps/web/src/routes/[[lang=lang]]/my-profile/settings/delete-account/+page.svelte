<script lang="ts">
import { deleteV1Accounts, logout, isApiError } from 'api-client';
import { AlertTriangle } from 'lucide-svelte';
import { Button, Checkbox, Input, Label, Loader, toastState } from 'ui';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';

const auth = useAuth();
const userEmail = $derived(auth.user?.email ?? '');

let password = $state('');
let confirmText = $state('');
let understood = $state(false);
let submitting = $state(false);
let serverError = $state<string | null>(null);

const confirmPhrase = 'DELETAR MINHA CONTA';
const ready = $derived(Boolean(password && confirmText === confirmPhrase && understood));

async function submit(e: Event) {
  e.preventDefault();
  if (!ready) return;
  submitting = true;
  serverError = null;
  try {
    await deleteV1Accounts({ confirmationPhrase: confirmPhrase });
    toastState.show('Conta removida. Até mais.', 'success');
    // Clear local session and send to landing.
    await logout({}).catch(() => {});
    goto('/');
  } catch (err) {
    if (isApiError(err) && err.message) {
      serverError = err.message;
    } else {
      serverError = 'Falha ao deletar. Verifique a senha.';
    }
  } finally {
    submitting = false;
  }
}
</script>

<svelte:head>
  <title>Deletar conta · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <div class="mb-3 flex items-center gap-2 text-red-500">
      <AlertTriangle size={20} />
      <h1 class="text-xl font-semibold">Deletar conta</h1>
    </div>
    <p class="text-sm text-gray-500 dark:text-neutral-500">
      Esta ação é <strong>irreversível</strong>. Todos os seus currículos, posts, conversas,
      aplicações e dados associados serão removidos permanentemente.
    </p>
  </header>

  <div
    class="mb-6 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300"
  >
    <p class="font-medium">Você vai perder:</p>
    <ul class="mt-2 list-disc space-y-1 pl-5 text-xs">
      <li>Todos os currículos e versões</li>
      <li>Histórico de aplicações e eventos de tracking</li>
      <li>Posts, comentários, curtidas e seguidores</li>
      <li>Conversas de chat e notificações</li>
      <li>Sessões OAuth conectadas (GitHub/LinkedIn)</li>
    </ul>
  </div>

  <form class="space-y-5" onsubmit={submit} novalidate>
    <div>
      <Label for="email">Conta</Label>
      <Input id="email" value={userEmail} readonly disabled />
    </div>

    <div>
      <Label for="password">Senha atual</Label>
      <Input
        id="password"
        type="password"
        bind:value={password}
        autocomplete="current-password"
        required
      />
    </div>

    <div>
      <Label for="confirm">
        Digite <code class="rounded bg-gray-100 px-1 dark:bg-neutral-800">{confirmPhrase}</code>
        para confirmar
      </Label>
      <Input id="confirm" bind:value={confirmText} autocomplete="off" spellcheck="false" />
    </div>

    <Checkbox bind:checked={understood} size="sm">
      <span class="text-xs text-gray-600 dark:text-neutral-400">
        Eu entendo que essa ação não pode ser desfeita e todos os meus dados serão apagados.
      </span>
    </Checkbox>

    {#if serverError}
      <p class="text-xs font-medium text-red-500/80" role="alert">{serverError}</p>
    {/if}

    <div class="flex gap-3">
      <Button type="button" variant="outline" onclick={() => goto('/my-profile/settings')}>
        Cancelar
      </Button>
      <Button type="submit" variant="solid" disabled={!ready || submitting}>
        {#if submitting}
          <Loader size={14} class="mr-2" />
        {/if}
        Deletar minha conta permanentemente
      </Button>
    </div>
  </form>
</div>
