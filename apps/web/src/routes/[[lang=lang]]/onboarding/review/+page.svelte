<script lang="ts">
import { AlertTriangle } from 'lucide-svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

// Shared review links are not currently exposed by the backend. The route
// stays around for anyone who still has an old email link and lands here —
// we just tell them the link is no longer active instead of silently failing
// on a dead endpoint. When the backend exposes /api/v1/onboarding/review/:token
// again, wire it through the generated SDK (no raw fetch).
</script>

<svelte:head>
  <title>Review de currículo · Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6" role="status" aria-live="polite">
  <div class="max-w-md text-center">
    <AlertTriangle size={32} class="mx-auto mb-4 text-amber-500" />
    <h1 class="text-lg font-medium text-gray-800 dark:text-neutral-200">
      {t('onboarding.review.inactiveHeading')}
    </h1>
    <p class="mt-2 text-sm text-gray-500 dark:text-neutral-500">
      O recurso de compartilhar currículos para review externo está temporariamente
      indisponível. Peça pra pessoa que enviou o link te mostrar o currículo direto.
    </p>
    <a
      href="/identity/sign-in"
      class="mt-6 inline-block text-xs font-medium text-cyan-500 hover:underline"
    >
      {t('onboarding.review.backToStart')}
    </a>
  </div>
</main>
