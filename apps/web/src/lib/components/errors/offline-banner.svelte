<!--
  OfflineBanner — shows a top-of-page strip when the browser reports
  no network. Uses the `online`/`offline` events plus an initial read.
-->
<script lang="ts">
import { WifiOff } from 'lucide-svelte';
import { onMount } from 'svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

let online = $state(true);

onMount(() => {
  online = navigator.onLine;
  const on = () => (online = true);
  const off = () => (online = false);
  window.addEventListener('online', on);
  window.addEventListener('offline', off);
  return () => {
    window.removeEventListener('online', on);
    window.removeEventListener('offline', off);
  };
});
</script>

{#if !online && t}
  <div
    class="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/95 px-4 py-2 text-sm text-amber-950 shadow"
    role="status"
    aria-live="polite"
  >
    <WifiOff size={16} />
    <span>{t('offlineBanner.message')}</span>
  </div>
{/if}
