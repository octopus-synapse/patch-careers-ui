<script lang="ts">
import { Github, Linkedin } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button } from 'ui';

interface Providers {
  github: boolean;
  linkedin: boolean;
}

let providers = $state<Providers>({ github: false, linkedin: false });
let loading = $state(true);

onMount(async () => {
  try {
    const [gh, li] = await Promise.all([
      fetch('/api/v1/auth/oauth/available/github').then((r) => r.json()),
      fetch('/api/v1/auth/oauth/available/linkedin').then((r) => r.json()),
    ]);
    providers = {
      github: Boolean((gh as { data?: { available?: boolean } })?.data?.available),
      linkedin: Boolean((li as { data?: { available?: boolean } })?.data?.available),
    };
  } finally {
    loading = false;
  }
});
</script>

<svelte:head>
  <title>Contas conectadas · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">Contas conectadas</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Faça login com provedores externos e importe dados do seu perfil.
    </p>
  </header>

  <ul class="space-y-3">
    <li class="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-neutral-800">
      <div class="flex items-center gap-3">
        <Github size={20} />
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">GitHub</p>
          <p class="text-xs text-gray-500 dark:text-neutral-500">
            Importar stack e repositórios para seu perfil.
          </p>
        </div>
      </div>
      {#if loading}
        <span class="text-xs text-gray-400">…</span>
      {:else if providers.github}
        <a
          href="/api/v1/auth/oauth/github/start"
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Conectar
        </a>
      {:else}
        <span class="text-xs text-gray-400 dark:text-neutral-500">Não configurado</span>
      {/if}
    </li>
    <li class="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-neutral-800">
      <div class="flex items-center gap-3">
        <Linkedin size={20} />
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">LinkedIn</p>
          <p class="text-xs text-gray-500 dark:text-neutral-500">
            Login via LinkedIn (import de perfil em breve).
          </p>
        </div>
      </div>
      {#if loading}
        <span class="text-xs text-gray-400">…</span>
      {:else if providers.linkedin}
        <a
          href="/api/v1/auth/oauth/linkedin/start"
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Conectar
        </a>
      {:else}
        <span class="text-xs text-gray-400 dark:text-neutral-500">Não configurado</span>
      {/if}
    </li>
  </ul>
</div>
