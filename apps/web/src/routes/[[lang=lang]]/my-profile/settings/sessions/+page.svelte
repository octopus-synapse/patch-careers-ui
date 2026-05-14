<script lang="ts">
import {
  listSessionsQueryKey,
  createListSessions,
  createRevokeSession,
} from 'api-client';
import { useQueryClient } from '@tanstack/svelte-query';
import { Monitor, Smartphone, X } from 'lucide-svelte';
import { Badge, Button, Loader, toastState } from 'ui';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { browser } from '$app/environment';
import { locale } from '$lib/state/locale.svelte';

const queryClient = useQueryClient();
const t = $derived(locale.t);

function formatAuthMethod(method: string | null): string | null {
  if (!method) return null;
  switch (method) {
    case 'PASSWORD':
      return 'senha';
    case '2FA_TOTP':
      return '2FA (app)';
    case '2FA_BACKUP_CODE':
      return '2FA (backup)';
    case 'OAUTH_GITHUB':
      return 'GitHub';
    case 'OAUTH_LINKEDIN':
      return 'LinkedIn';
    case 'OAUTH_GOOGLE':
      return 'Google';
    default:
      return method;
  }
}

const sessionsQuery = createListSessions({
  query: { enabled: browser, retry: false, refetchOnWindowFocus: false },
});

const sessions = $derived($sessionsQuery.data?.sessions ?? []);

const revoke = createRevokeSession({
  mutation: {
    async onSuccess() {
      toastState.show(t('success.sessionRevoked'), 'success');
      await queryClient.invalidateQueries({ queryKey: listSessionsQueryKey() });
    },
    onError: handleApiError,
  },
});

let revokingId = $state<string | null>(null);

function handleRevoke(id: string) {
  revokingId = id;
  $revoke.mutate({ id }, { onSettled: () => (revokingId = null) });
}

function formatDevice(ua: string | null): string {
  if (!ua) return 'Desconhecido';
  if (/iPhone|Android|Mobile/i.test(ua)) return 'Dispositivo móvel';
  if (/Chrome/.test(ua)) return 'Chrome';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Safari/.test(ua)) return 'Safari';
  return ua.slice(0, 40);
}
</script>

<svelte:head>
  <title>Sessões e dispositivos · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
      {t('settings.sessionsHeading')}
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Dispositivos com sessão ativa na sua conta. Revogar uma sessão desloga aquele aparelho na
      próxima requisição autenticada.
    </p>
  </header>

  {#if $sessionsQuery.isLoading}
    <div class="flex justify-center py-12">
      <Loader size={20} />
    </div>
  {:else if sessions.length === 0}
    <p class="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
      Nenhuma sessão ativa registrada.
    </p>
  {:else}
    <ul class="space-y-3">
      {#each sessions as s (s.id)}
        <li
          class="flex items-start justify-between rounded-lg border p-4 transition-opacity"
          class:opacity-50={s.revoked}
          class:border-gray-200={!s.revoked}
          class:dark:border-neutral-800={!s.revoked}
          class:border-red-200={s.revoked}
          class:dark:border-red-900={s.revoked}
        >
          <div class="flex items-start gap-3">
            {#if /Mobile|Android|iPhone/i.test(s.userAgent ?? '')}
              <Smartphone size={20} class="mt-0.5 text-gray-400" />
            {:else}
              <Monitor size={20} class="mt-0.5 text-gray-400" />
            {/if}
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">
                  {s.deviceName ?? formatDevice(s.userAgent)}
                </p>
                {#if formatAuthMethod(s.authMethod)}
                  <Badge intent="neutral" size="md">
                    via {formatAuthMethod(s.authMethod)}
                  </Badge>
                {/if}
              </div>
              <p class="text-xs text-gray-500 dark:text-neutral-500">
                {s.ipAddress ?? 'IP desconhecido'}
              </p>
              <p class="text-xs text-gray-400 dark:text-neutral-600">
                Criada: {new Date(s.createdAt).toLocaleString()}
                {#if s.lastUsedAt}
                  · Última atividade: {new Date(s.lastUsedAt).toLocaleString()}
                {/if}
              </p>
            </div>
          </div>
          {#if !s.revoked}
            <Button
              variant="outline"
              size="sm"
              onclick={() => handleRevoke(s.id)}
              disabled={revokingId === s.id}
            >
              {#if revokingId === s.id}
                <Loader size={14} />
              {:else}
                <X size={14} />
                Revogar
              {/if}
            </Button>
          {:else}
            <span class="text-xs text-red-500">Revogada</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
