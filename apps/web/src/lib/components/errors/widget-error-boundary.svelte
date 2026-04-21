<script lang="ts">
import type { Snippet } from 'svelte';
import { onMount } from 'svelte';
import { AlertCircle, RotateCw } from 'lucide-svelte';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  children: Snippet;
  label?: string;
};

let { children, label }: Props = $props();

const t = $derived(locale.t);
let error = $state<unknown>(null);

onMount(() => {
  // Window-level error listener is a crude net; ErrorBoundary at the page
  // level catches unhandled rejections too, but we want per-widget
  // isolation so a crash in one card doesn't wipe the whole dashboard.
  const onError = (e: ErrorEvent) => {
    if (e.error) error = e.error;
  };
  window.addEventListener('error', onError);
  return () => window.removeEventListener('error', onError);
});

function reset() {
  error = null;
}
</script>

{#if error}
	<div
		role="alert"
		class="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
	>
		<div class="flex items-center gap-2 min-w-0">
			<AlertCircle size={14} class="shrink-0" />
			<span class="truncate">{label ?? t('widget.unavailable')}</span>
		</div>
		<button
			type="button"
			onclick={reset}
			class="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-300 px-2 py-0.5 text-xs text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/40"
		>
			<RotateCw size={12} />
			{t('widget.retry')}
		</button>
	</div>
{:else}
	{@render children()}
{/if}
