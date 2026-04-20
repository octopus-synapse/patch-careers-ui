<!--
  Companion banner for useRetryableSubmit. Renders a red strip with the
  error message and a "Tentar de novo" button that re-invokes the last
  submission without losing the form state.
-->
<script lang="ts">
import { AlertTriangle, Loader2, RotateCw } from 'lucide-svelte';
import { Button } from 'ui';

interface Props {
  error: unknown;
  retrying: boolean;
  onretry: () => void;
  hint?: string;
}

let { error, retrying, onretry, hint }: Props = $props();

const message = $derived.by(() => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Falha no envio.';
});
</script>

<div
  class="flex flex-col items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
  role="alert"
  aria-live="assertive"
>
  <div class="flex items-start gap-2 text-red-700 dark:text-red-300">
    <AlertTriangle size={16} class="mt-0.5 shrink-0" />
    <div>
      <p class="font-medium">{message}</p>
      {#if hint}
        <p class="mt-0.5 text-xs text-red-700/70 dark:text-red-300/70">{hint}</p>
      {:else}
        <p class="mt-0.5 text-xs text-red-700/70 dark:text-red-300/70">
          Seus dados ficaram preservados. Quer tentar de novo?
        </p>
      {/if}
    </div>
  </div>
  <Button variant="outline" size="sm" onclick={onretry} disabled={retrying}>
    {#if retrying}
      <Loader2 size={14} class="animate-spin" />
    {:else}
      <RotateCw size={14} />
    {/if}
    Tentar de novo
  </Button>
</div>
