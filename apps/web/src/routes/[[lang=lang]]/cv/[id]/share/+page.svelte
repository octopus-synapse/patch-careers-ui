<!--
  Share management page for a resume — list existing share links, create a new
  one with optional password + expiry, revoke.
-->
<script lang="ts">
import { Copy, Link as LinkIcon, Loader2, Lock, Trash2 } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, Input, Label, toastState } from 'ui';
import { browser } from '$app/environment';
import { page } from '$app/stores';

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

let shares = $state<Share[]>([]);
let loading = $state(true);
let creating = $state(false);

// Form state for new share
let customSlug = $state('');
let password = $state('');
let expiresInDays = $state<number | null>(30);

async function load() {
  if (!browser) return;
  loading = true;
  try {
    const res = await fetch(`/api/v1/resume-shares?resumeId=${resumeId}`, {
      credentials: 'include',
    });
    const body = (await res.json()) as { data?: { shares?: Share[] } };
    shares = body.data?.shares ?? [];
  } catch {
    toastState.show('Falha ao carregar links.', 'danger');
  } finally {
    loading = false;
  }
}

async function createShare() {
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
    const res = await fetch('/api/v1/resume-shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    customSlug = '';
    password = '';
    expiresInDays = 30;
    await load();
    toastState.show('Link criado.', 'success');
  } catch {
    toastState.show('Falha ao criar link.', 'danger');
  } finally {
    creating = false;
  }
}

async function revoke(id: string) {
  if (!confirm('Remover este link compartilhado?')) return;
  try {
    const res = await fetch(`/api/v1/resume-shares/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    shares = shares.filter((s) => s.id !== id);
  } catch {
    toastState.show('Falha ao remover.', 'danger');
  }
}

async function copyUrl(slug: string) {
  const url = `${window.location.origin}/s/${slug}`;
  await navigator.clipboard.writeText(url);
  toastState.show('Link copiado.', 'success');
}

onMount(load);
</script>

<svelte:head>
  <title>Compartilhar currículo · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
      Compartilhar currículo
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Crie links públicos com senha opcional e data de expiração.
    </p>
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
          pattern="[a-z0-9-]+"
        />
        <p class="mt-1 text-[11px] text-gray-400">Só minúsculas, números e hífen.</p>
      </div>

      <div>
        <Label for="password">Senha (opcional)</Label>
        <Input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Deixe vazio para link público"
        />
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
          <Loader2 size={14} class="mr-2 animate-spin" />
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
        <Loader2 size={16} class="animate-spin text-gray-500" />
      </div>
    {:else if shares.length === 0}
      <p class="rounded-lg border border-gray-200 p-6 text-center text-xs text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
        Nenhum link público ainda.
      </p>
    {:else}
      <ul class="space-y-3">
        {#each shares as s (s.id)}
          <li class="flex items-start justify-between rounded-lg border border-gray-200 p-4 dark:border-neutral-800">
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
              <Button variant="icon" size="xs" onclick={() => copyUrl(s.slug)} aria-label="Copiar link">
                <Copy size={14} />
              </Button>
              <Button variant="icon" size="xs" onclick={() => revoke(s.id)} aria-label="Remover">
                <Trash2 size={14} class="text-red-500" />
              </Button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
