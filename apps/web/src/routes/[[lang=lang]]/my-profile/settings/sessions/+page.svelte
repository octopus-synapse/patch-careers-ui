<script lang="ts">
import { Loader2, Monitor, Smartphone, X } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, toastState } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

interface SessionRow {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  revoked: boolean;
}

let sessions = $state<SessionRow[]>([]);
let loading = $state(true);
let revoking = $state<string | null>(null);

async function load() {
  loading = true;
  try {
    const res = await fetch('/api/auth/sessions', { credentials: 'include' });
    const body = (await res.json()) as { data?: { sessions?: SessionRow[] } };
    sessions = body.data?.sessions ?? [];
  } catch {
    toastState.show(t('errors.loadSessionsFailed'), 'danger');
  } finally {
    loading = false;
  }
}

async function revoke(id: string) {
  revoking = id;
  try {
    const res = await fetch(`/api/auth/sessions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    sessions = sessions.map((s) => (s.id === id ? { ...s, revoked: true } : s));
    toastState.show(t('success.sessionRevoked'), 'success');
  } catch {
    toastState.show(t('errors.revokeSessionFailed'), 'danger');
  } finally {
    revoking = null;
  }
}

function formatDevice(ua: string | null): string {
  if (!ua) return 'Desconhecido';
  if (/iPhone|Android|Mobile/i.test(ua)) return 'Dispositivo móvel';
  if (/Chrome/.test(ua)) return 'Chrome';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Safari/.test(ua)) return 'Safari';
  return ua.slice(0, 40);
}

onMount(load);
</script>

<svelte:head>
  <title>Sessões e dispositivos · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
      Sessões e dispositivos
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Dispositivos com sessão ativa na sua conta. Revogar uma sessão desloga aquele aparelho na
      próxima requisição autenticada.
    </p>
  </header>

  {#if loading}
    <div class="flex justify-center py-12">
      <Loader2 size={20} class="animate-spin text-gray-500" />
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
              <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">
                {s.deviceName ?? formatDevice(s.userAgent)}
              </p>
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
              onclick={() => revoke(s.id)}
              disabled={revoking === s.id}
            >
              {#if revoking === s.id}
                <Loader2 size={14} class="animate-spin" />
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
