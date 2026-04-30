<!--
  Share management page for a resume — list existing share links, create a new
  one with optional password + expiry, manage slug aliases, download QR codes,
  and grab the all-formats bundle zip.
-->
<script lang="ts">
import { ChevronDown, ChevronRight, Copy, Download, Link as LinkIcon, Lock, Package, Plus, QrCode, Trash2 } from 'lucide-svelte';
import QRCode from 'qrcode';
import { onMount } from 'svelte';
import { Button, Input, Label, Loader, toastState } from 'ui';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const resumeId = $derived($page.params.id);

interface Share {
  id: string;
  slug: string;
  resumeId: string;
  isActive: boolean;
  hasPassword: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface Alias {
  id: string;
  slug: string;
  shareId: string;
}

let shares = $state<Share[]>([]);
let loading = $state(true);
let creating = $state(false);

// Aliases per share id, lazy-loaded on expand.
const aliasesByShare = $state<Record<string, Alias[]>>({});
const aliasLoading = $state<Record<string, boolean>>({});
const newAliasInput = $state<Record<string, string>>({});
const expandedShare = $state<Record<string, boolean>>({});

let bundleDownloading = $state(false);

// Form state for new share
let customSlug = $state('');
let password = $state('');
let expiresInDays = $state<number | null>(30);
let createError = $state<{ field?: 'slug' | 'password'; message: string } | null>(null);
let copiedSlug = $state<string | null>(null);

const SLUG_PATTERN = /^[a-zA-Z0-9-]+$/;

function validateCreate(): boolean {
  createError = null;
  const slug = customSlug.trim();
  if (slug && !SLUG_PATTERN.test(slug)) {
    createError = { field: 'slug', message: 'Slug deve conter apenas letras, números e hifens.' };
    return false;
  }
  if (slug && (slug.length < 3 || slug.length > 80)) {
    createError = { field: 'slug', message: 'Slug deve ter entre 3 e 80 caracteres.' };
    return false;
  }
  const pw = password.trim();
  if (pw && (pw.length < 4 || pw.length > 200)) {
    createError = { field: 'password', message: 'Senha deve ter entre 4 e 200 caracteres.' };
    return false;
  }
  return true;
}

async function load() {
  if (!browser) return;
  loading = true;
  try {
    const res = await fetch(`/api/v1/shares/resume/${resumeId}`, {
      credentials: 'include',
    });
    // `?? body.shares` is a defensive fallback for the legacy duplicated shape
    // produced by the backend before profile-services PR #213 normalized it.
    const body = (await res.json()) as { data?: { shares?: Share[] }; shares?: Share[] };
    shares = body.data?.shares ?? body.shares ?? [];
  } catch {
    toastState.show(t('errors.loadSharesFailed'), 'danger');
  } finally {
    loading = false;
  }
}

async function createShare() {
  if (!validateCreate()) return;
  creating = true;
  try {
    const body: Record<string, unknown> = { resumeId };
    if (customSlug.trim()) body.slug = customSlug.trim();
    if (password.trim()) body.password = password.trim();
    if (expiresInDays !== null) {
      const exp = new Date();
      exp.setDate(exp.getDate() + expiresInDays);
      body.expiresAt = exp.toISOString();
    }
    const res = await fetch('/api/v1/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (res.status === 409) {
      createError = { field: 'slug', message: 'Esse slug já está em uso. Escolha outro.' };
      return;
    }
    if (!res.ok) {
      const errBody = (await res.json().catch(() => null)) as
        | { error?: { message?: string; userMessage?: string } }
        | null;
      const msg = errBody?.error?.userMessage ?? errBody?.error?.message ?? 'Falha ao criar link.';
      throw new Error(msg);
    }
    customSlug = '';
    password = '';
    expiresInDays = 30;
    await load();
    toastState.show(t('success.shareCreated'), 'success');
  } catch (err) {
    toastState.show(err instanceof Error ? err.message : 'Falha ao criar link.', 'danger');
  } finally {
    creating = false;
  }
}

async function revoke(id: string) {
  if (!confirm('Remover este link compartilhado? Os aliases vão junto.')) return;
  try {
    const res = await fetch(`/api/v1/shares/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    shares = shares.filter((s) => s.id !== id);
    delete aliasesByShare[id];
    delete expandedShare[id];
  } catch {
    toastState.show(t('errors.removeFailed'), 'danger');
  }
}

async function copyUrl(slug: string) {
  const url = `${window.location.origin}/s/${slug}`;
  await navigator.clipboard.writeText(url);
  copiedSlug = slug;
  toastState.show(t('success.linkCopied'), 'success');
  // Clear the inline "Copied!" badge after a short window so the next copy
  // re-triggers the visual change.
  setTimeout(() => {
    if (copiedSlug === slug) copiedSlug = null;
  }, 2000);
}

async function loadAliases(shareId: string) {
  if (aliasLoading[shareId]) return;
  aliasLoading[shareId] = true;
  try {
    const res = await fetch(`/api/v1/shares/${shareId}/aliases`, { credentials: 'include' });
    const body = (await res.json()) as { data?: { aliases?: Alias[] } };
    aliasesByShare[shareId] = body.data?.aliases ?? [];
  } catch {
    toastState.show(t('errors.loadAliasesFailed'), 'danger');
  } finally {
    aliasLoading[shareId] = false;
  }
}

async function toggleAliases(shareId: string) {
  expandedShare[shareId] = !expandedShare[shareId];
  if (expandedShare[shareId] && !aliasesByShare[shareId]) {
    await loadAliases(shareId);
  }
}

async function addAlias(shareId: string) {
  const slug = (newAliasInput[shareId] ?? '').trim();
  if (!slug) return;
  try {
    const res = await fetch(`/api/v1/shares/${shareId}/aliases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ slug }),
    });
    if (res.status === 409) {
      toastState.show('Esse slug já está em uso.', 'danger');
      return;
    }
    if (!res.ok) throw new Error();
    newAliasInput[shareId] = '';
    await loadAliases(shareId);
    toastState.show(t('success.aliasAdded'), 'success');
  } catch {
    toastState.show('Falha ao adicionar alias.', 'danger');
  }
}

async function removeAlias(shareId: string, aliasId: string) {
  if (!confirm('Remover este alias?')) return;
  try {
    const res = await fetch(`/api/v1/shares/aliases/${aliasId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    aliasesByShare[shareId] = (aliasesByShare[shareId] ?? []).filter((a) => a.id !== aliasId);
  } catch {
    toastState.show('Falha ao remover alias.', 'danger');
  }
}

// Inline QR preview per slug — rendered to a data URL so sharing the link
// across a call or demo doesn't require a download. Generated lazily the
// first time the share row mounts.
const qrDataUrls = $state<Record<string, string>>({});

async function renderInlineQr(slug: string) {
  if (qrDataUrls[slug] || typeof window === 'undefined') return;
  try {
    const url = `${window.location.origin}/s/${slug}`;
    qrDataUrls[slug] = await QRCode.toDataURL(url, { margin: 1, width: 160 });
  } catch {
    /* fail silently — download button remains as fallback */
  }
}

function downloadQr(shareId: string, slug: string) {
  // Server returns a PNG via streamable file — open in new tab so the browser
  // can prompt save with the right filename. Adding a hidden anchor would also
  // work; this is one less DOM dance.
  const url = `/api/v1/shares/${shareId}/qr.png?size=512`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `qr-${slug}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function downloadBundle() {
  bundleDownloading = true;
  try {
    const res = await fetch('/api/v1/export/resume/bundle', { credentials: 'include' });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-bundle.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toastState.show('Bundle baixado.', 'success');
  } catch {
    toastState.show('Falha ao baixar bundle.', 'danger');
  } finally {
    bundleDownloading = false;
  }
}

onMount(load);
</script>

<svelte:head>
  <title>Compartilhar currículo · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <header class="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
        Compartilhar currículo
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
        Crie links públicos com senha opcional, expiração e aliases.
      </p>
    </div>
    <Button variant="outline" size="sm" onclick={downloadBundle} disabled={bundleDownloading}>
      {#if bundleDownloading}
        <Loader size={14} class="mr-2" />
      {:else}
        <Package size={14} class="mr-2" />
      {/if}
      Baixar tudo (.zip)
    </Button>
  </header>

  <section
    class="mb-8 rounded-xl border border-gray-200 p-5 dark:border-neutral-800"
    aria-labelledby="create-heading"
  >
    <h2 id="create-heading" class="mb-4 text-sm font-semibold text-gray-900 dark:text-neutral-100">
      Novo link
    </h2>
    <form
      class="space-y-4"
      onsubmit={(e) => {
        e.preventDefault();
        createShare();
      }}
    >
      <div>
        <Label for="slug">Slug custom (opcional)</Label>
        <Input
          id="slug"
          bind:value={customSlug}
          placeholder="enzo-backend-2026"
          pattern="[a-zA-Z0-9-]+"
          aria-invalid={createError?.field === 'slug'}
          aria-describedby="slug-help"
        />
        <p id="slug-help" class="mt-1 text-[11px] text-gray-400">
          Letras, números e hífen. 3 a 80 caracteres.
        </p>
        {#if createError?.field === 'slug'}
          <p class="mt-1 text-[11px] text-red-600 dark:text-red-400" role="alert">
            {createError.message}
          </p>
        {/if}
      </div>

      <div>
        <Label for="password">Senha (opcional)</Label>
        <Input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Deixe vazio para link público"
          aria-invalid={createError?.field === 'password'}
        />
        {#if createError?.field === 'password'}
          <p class="mt-1 text-[11px] text-red-600 dark:text-red-400" role="alert">
            {createError.message}
          </p>
        {/if}
      </div>

      <div>
        <Label for="expires">Expira em</Label>
        <select
          id="expires"
          bind:value={expiresInDays}
          class="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value={7}>7 dias</option>
          <option value={30}>30 dias</option>
          <option value={90}>90 dias</option>
          <option value={null}>Nunca expira</option>
        </select>
      </div>

      <Button type="submit" variant="solid" disabled={creating}>
        {#if creating}
          <Loader size={14} class="mr-2" />
        {:else}
          <LinkIcon size={14} class="mr-2" />
        {/if}
        Criar link
      </Button>
    </form>
  </section>

  <section aria-labelledby="active-heading">
    <h2 id="active-heading" class="mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100">
      Links ativos
    </h2>
    {#if loading}
      <div class="flex justify-center py-6">
        <Loader size={16} />
      </div>
    {:else if shares.length === 0}
      <p class="rounded-lg border border-gray-200 p-6 text-center text-xs text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
        Nenhum link público ainda.
      </p>
    {:else}
      <ul class="space-y-3">
        {#each shares as s (s.id)}
          {void renderInlineQr(s.slug)}
          <li class="rounded-lg border border-gray-200 p-4 dark:border-neutral-800">
            <div class="flex items-start justify-between gap-3">
              {#if qrDataUrls[s.slug]}
                <img
                  src={qrDataUrls[s.slug]}
                  alt="QR para /s/{s.slug}"
                  class="h-20 w-20 shrink-0 rounded border border-gray-200 bg-white p-1 dark:border-neutral-700"
                />
              {/if}
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-neutral-100">
                  <span class="truncate">/s/{s.slug}</span>
                  {#if s.hasPassword}
                    <Lock size={12} class="text-amber-500" aria-label="Protegido por senha" />
                  {/if}
                </p>
                <p class="mt-1 text-[11px] text-gray-500 dark:text-neutral-500">
                  Criado: {new Date(s.createdAt).toLocaleDateString()}
                  {#if s.expiresAt}
                    · Expira: {new Date(s.expiresAt).toLocaleDateString()}
                  {:else}
                    · Sem expiração
                  {/if}
                </p>
              </div>
              <div class="ml-3 flex items-center gap-1">
                <Button
                  variant="icon"
                  size="xs"
                  onclick={() => copyUrl(s.slug)}
                  aria-label={copiedSlug === s.slug ? t('actions.linkCopied') : t('actions.copyLink')}
                  title={copiedSlug === s.slug ? t('actions.linkCopied') : t('actions.copyLink')}
                >
                  <Copy size={14} class={copiedSlug === s.slug ? 'text-green-500' : ''} />
                </Button>
                <Button variant="icon" size="xs" onclick={() => downloadQr(s.id, s.slug)} aria-label="Baixar QR">
                  <QrCode size={14} />
                </Button>
                <Button variant="icon" size="xs" onclick={() => revoke(s.id)} aria-label={t('actions.remove')}>
                  <Trash2 size={14} class="text-red-500" />
                </Button>
              </div>
            </div>

            <button
              type="button"
              class="mt-3 flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              onclick={() => toggleAliases(s.id)}
            >
              {#if expandedShare[s.id]}
                <ChevronDown size={12} />
              {:else}
                <ChevronRight size={12} />
              {/if}
              Aliases ({aliasesByShare[s.id]?.length ?? '...'})
            </button>

            {#if expandedShare[s.id]}
              <div class="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-neutral-800">
                {#if aliasLoading[s.id]}
                  <Loader size={12} />
                {:else if (aliasesByShare[s.id]?.length ?? 0) === 0}
                  <p class="text-[11px] text-gray-400">
                    Sem aliases. Crie um pra renomear esse link sem invalidar QR codes/cards já distribuídos.
                  </p>
                {:else}
                  <ul class="space-y-1">
                    {#each aliasesByShare[s.id] as a (a.id)}
                      <li class="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-[11px] dark:bg-neutral-900">
                        <span class="font-mono">/s/{a.slug}</span>
                        <Button variant="icon" size="xs" onclick={() => removeAlias(s.id, a.id)} aria-label={t('actions.removeAlias')}>
                          <Trash2 size={12} class="text-red-500" />
                        </Button>
                      </li>
                    {/each}
                  </ul>
                {/if}
                <form
                  class="mt-2 flex gap-2"
                  onsubmit={(e) => {
                    e.preventDefault();
                    addAlias(s.id);
                  }}
                >
                  <input
                    type="text"
                    bind:value={newAliasInput[s.id]}
                    placeholder="novo-alias"
                    pattern="[a-zA-Z0-9-]+"
                    class="flex-1 rounded border border-gray-200 px-2 py-1 text-[11px] dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <Button type="submit" variant="outline" size="xs">
                    <Plus size={12} />
                  </Button>
                </form>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
