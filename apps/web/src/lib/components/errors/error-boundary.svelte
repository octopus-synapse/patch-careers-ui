<!--
  ErrorBoundary — Svelte 5 equivalent of React error boundary. Catches
  runtime errors thrown anywhere inside the slot and renders a friendly
  fallback with a reload button.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import { onMount } from 'svelte';

interface Props {
  children: Snippet;
  fallback?: Snippet<[{ error: unknown; reset: () => void }]>;
}

let { children, fallback }: Props = $props();
let error = $state<unknown>(null);

function reset() {
  error = null;
}

onMount(() => {
  const onWindowError = (e: ErrorEvent) => {
    // Only capture real runtime errors, not third-party noise.
    if (e.error) error = e.error;
  };
  const onRejection = (e: PromiseRejectionEvent) => {
    error = e.reason;
  };
  window.addEventListener('error', onWindowError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onWindowError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
});

const message = $derived(
  error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error',
);
</script>

{#if error}
  {#if fallback}
    {@render fallback({ error, reset })}
  {:else}
    <div
      class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
        Algo deu errado.
      </h1>
      <p class="max-w-md text-sm text-gray-600 dark:text-neutral-400">{message}</p>
      <div class="flex gap-3">
        <button
          type="button"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white"
          onclick={reset}
        >
          Tentar novamente
        </button>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          onclick={() => location.reload()}
        >
          Recarregar página
        </button>
      </div>
    </div>
  {/if}
{:else}
  {@render children()}
{/if}
