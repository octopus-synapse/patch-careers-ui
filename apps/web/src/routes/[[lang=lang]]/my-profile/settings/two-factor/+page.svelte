<!--
  Dedicated 2FA management page.
  - Shows current status (enabled/disabled)
  - Setup flow: QR → verify TOTP → reveal one-time backup codes
  - Regenerate backup codes (requires current password)
  - Disable (requires confirmation)
-->
<script lang="ts">
import { Copy, Download, RefreshCw, Shield, ShieldOff } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, Input, Label, Loader, toastState } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

type Status = { enabled: boolean; enabledAt: string | null; lastUsedAt: string | null };

let status = $state<Status | null>(null);
let loadingStatus = $state(true);

// Setup state
let setupSecret = $state<string | null>(null);
let setupQrUrl = $state<string | null>(null);
let setupLoading = $state(false);
let verifyToken = $state('');
let verifyLoading = $state(false);
let backupCodes = $state<string[] | null>(null);

// Disable state
let disableConfirming = $state(false);
let disableLoading = $state(false);
let disablePassword = $state('');

// Regen state
let regenLoading = $state(false);
let regenPassword = $state('');

async function loadStatus() {
  loadingStatus = true;
  try {
    const res = await fetch('/api/auth/2fa/status', { credentials: 'include' });
    const body = (await res.json()) as { data?: Status };
    status = body.data ?? { enabled: false, enabledAt: null, lastUsedAt: null };
  } finally {
    loadingStatus = false;
  }
}

async function startSetup() {
  setupLoading = true;
  try {
    const res = await fetch('/api/auth/2fa/setup', {
      method: 'POST',
      credentials: 'include',
    });
    const body = (await res.json()) as {
      data?: { secret?: string; qrCodeUrl?: string };
    };
    setupSecret = body.data?.secret ?? null;
    setupQrUrl = body.data?.qrCodeUrl ?? null;
  } catch {
    toastState.show(t('errors.twoFactorSetupFailed'), 'danger');
  } finally {
    setupLoading = false;
  }
}

async function verifyAndEnable() {
  if (!verifyToken.trim()) return;
  verifyLoading = true;
  try {
    const res = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: verifyToken }),
    });
    const body = (await res.json()) as { data?: { backupCodes?: string[] } };
    if (!res.ok) throw new Error();
    backupCodes = body.data?.backupCodes ?? [];
    setupSecret = null;
    setupQrUrl = null;
    verifyToken = '';
    await loadStatus();
  } catch {
    toastState.show(t('errors.twoFactorInvalidCode'), 'danger');
  } finally {
    verifyLoading = false;
  }
}

async function disable() {
  if (!disablePassword) return;
  disableLoading = true;
  try {
    const res = await fetch('/api/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: disablePassword }),
    });
    if (!res.ok) throw new Error();
    disableConfirming = false;
    disablePassword = '';
    toastState.show('2FA desativado.', 'success');
    await loadStatus();
  } catch {
    toastState.show('Senha incorreta ou falha ao desativar.', 'danger');
  } finally {
    disableLoading = false;
  }
}

async function regenBackupCodes() {
  if (!regenPassword) return;
  regenLoading = true;
  try {
    const res = await fetch('/api/auth/2fa/backup-codes/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: regenPassword }),
    });
    const body = (await res.json()) as { data?: { backupCodes?: string[] } };
    if (!res.ok) throw new Error();
    backupCodes = body.data?.backupCodes ?? [];
    regenPassword = '';
  } catch {
    toastState.show(t('errors.twoFactorRegenFailed'), 'danger');
  } finally {
    regenLoading = false;
  }
}

async function copyCodes() {
  if (!backupCodes) return;
  await navigator.clipboard.writeText(backupCodes.join('\n'));
  toastState.show('Códigos copiados.', 'success');
}

function downloadCodes() {
  if (!backupCodes) return;
  const blob = new Blob(
    [
      `Patch Careers — códigos de backup 2FA\nGerados em ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nGuarde em local seguro. Cada código só pode ser usado uma vez.`,
    ],
    { type: 'text/plain' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'patch-careers-2fa-backup-codes.txt';
  a.click();
  URL.revokeObjectURL(url);
}

onMount(loadStatus);
</script>

<svelte:head>
  <title>Autenticação de dois fatores · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
      Autenticação de dois fatores
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Adicione uma camada extra de segurança ao seu login.
    </p>
  </header>

  {#if loadingStatus}
    <div class="flex justify-center py-12">
      <Loader size={20} />
    </div>
  {:else if backupCodes}
    <!-- Backup codes reveal (one-time display) -->
    <div
      class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm"
      role="alert"
      aria-live="assertive"
    >
      <h2 class="mb-2 font-semibold text-amber-700 dark:text-amber-300">
        Guarde esses códigos agora
      </h2>
      <p class="mb-4 text-amber-700/80 dark:text-amber-300/80">
        Estes são seus 10 códigos de recuperação. Cada um só pode ser usado uma vez. Se perder
        acesso ao seu app autenticador, use um código abaixo.
        <strong>Esta é a única vez que eles serão mostrados.</strong>
      </p>
      <ul class="my-4 grid grid-cols-2 gap-2 font-mono text-sm">
        {#each backupCodes as code}
          <li class="rounded border border-amber-500/30 bg-white px-3 py-2 dark:bg-neutral-900">
            {code}
          </li>
        {/each}
      </ul>
      <div class="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onclick={copyCodes}>
          <Copy size={14} class="mr-1" />
          Copiar
        </Button>
        <Button variant="outline" size="sm" onclick={downloadCodes}>
          <Download size={14} class="mr-1" />
          Baixar .txt
        </Button>
        <Button variant="solid" size="sm" onclick={() => (backupCodes = null)}>
          Guardei em local seguro
        </Button>
      </div>
    </div>
  {:else if status?.enabled}
    <!-- Enabled: regen + disable -->
    <div class="space-y-5">
      <div class="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <Shield class="mt-0.5 text-emerald-500" size={20} />
        <div class="flex-1">
          <h2 class="font-semibold text-emerald-700 dark:text-emerald-300">2FA ativo</h2>
          <p class="text-xs text-emerald-700/80 dark:text-emerald-300/80">
            {#if status.enabledAt}
              Ativado em {new Date(status.enabledAt).toLocaleString()}.
            {/if}
            {#if status.lastUsedAt}
              Último uso: {new Date(status.lastUsedAt).toLocaleString()}.
            {/if}
          </p>
        </div>
      </div>

      <section class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
        <h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-neutral-100">
          Regenerar códigos de backup
        </h3>
        <p class="mb-3 text-xs text-gray-500 dark:text-neutral-500">
          Invalida os códigos atuais e gera 10 novos. Digite sua senha para confirmar.
        </p>
        <div class="flex gap-2">
          <Input type="password" placeholder="Senha atual" bind:value={regenPassword} />
          <Button
            variant="outline"
            onclick={regenBackupCodes}
            disabled={regenLoading || !regenPassword}
          >
            {#if regenLoading}
              <Loader size={14} />
            {:else}
              <RefreshCw size={14} class="mr-1" />
              Regenerar
            {/if}
          </Button>
        </div>
      </section>

      <section class="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
          <ShieldOff size={16} />
          Desativar 2FA
        </h3>
        <p class="mb-3 text-xs text-red-700/80 dark:text-red-300/80">
          Isso remove a proteção extra da sua conta. Não recomendamos, especialmente se você é
          admin.
        </p>
        {#if disableConfirming}
          <div class="flex gap-2">
            <Input type="password" placeholder="Senha atual" bind:value={disablePassword} />
            <Button
              variant="solid"
              onclick={disable}
              disabled={disableLoading || !disablePassword}
            >
              {#if disableLoading}
                <Loader size={14} />
              {:else}
                Confirmar
              {/if}
            </Button>
            <Button variant="outline" onclick={() => (disableConfirming = false)}>
              Cancelar
            </Button>
          </div>
        {:else}
          <Button variant="outline" onclick={() => (disableConfirming = true)}>
            Desativar 2FA
          </Button>
        {/if}
      </section>
    </div>
  {:else if setupQrUrl}
    <!-- Setup: QR + verify -->
    <div class="space-y-4 rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
        Escaneie o QR com seu app autenticador
      </h2>
      <img
        src={setupQrUrl}
        alt="QR code para configuração 2FA"
        class="mx-auto rounded-lg border border-gray-200 dark:border-neutral-800"
      />
      {#if setupSecret}
        <details class="text-xs text-gray-500 dark:text-neutral-500">
          <summary class="cursor-pointer">Ou digite o segredo manualmente</summary>
          <code class="mt-2 block rounded bg-gray-100 p-2 font-mono text-xs dark:bg-neutral-800">
            {setupSecret}
          </code>
        </details>
      {/if}
      <div>
        <Label for="verify-token">Código de 6 dígitos do app</Label>
        <Input
          id="verify-token"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength={6}
          bind:value={verifyToken}
        />
      </div>
      <Button
        variant="solid"
        onclick={verifyAndEnable}
        disabled={verifyLoading || verifyToken.length !== 6}
      >
        {#if verifyLoading}
          <Loader size={14} />
        {:else}
          Verificar e ativar
        {/if}
      </Button>
    </div>
  {:else}
    <!-- Disabled: offer setup -->
    <div class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
      <h2 class="mb-2 text-sm font-semibold text-gray-900 dark:text-neutral-100">
        2FA não configurado
      </h2>
      <p class="mb-4 text-xs text-gray-500 dark:text-neutral-500">
        Use um app como Google Authenticator, 1Password ou Authy para gerar códigos temporários.
      </p>
      <Button variant="solid" onclick={startSetup} disabled={setupLoading}>
        {#if setupLoading}
          <Loader size={14} />
        {:else}
          Iniciar configuração
        {/if}
      </Button>
    </div>
  {/if}
</div>
