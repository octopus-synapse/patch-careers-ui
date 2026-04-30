<script lang="ts">
  import { Card } from 'ui';

  /**
   * Skeleton shown when the dashboard backend ships a widget `type` the
   * frontend doesn't know how to render. Matches the dumb-frontend rule —
   * we don't guess; we surface a placeholder and ship the new component
   * in a follow-up. The widget id is included to make missing-type bug
   * reports trivially actionable.
   */
  type Props = {
    id: string;
    type: string;
    label?: string;
  };

  const { id, type, label }: Props = $props();
</script>

<Card>
  {#snippet title()}
    <h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
      {label ?? 'Widget'}
    </h2>
  {/snippet}

  <div
    class="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-500"
    data-widget-id={id}
    data-widget-type={type}
  >
    <p class="font-mono">Unsupported widget: <span class="font-semibold">{type}</span></p>
    <p class="mt-1">id: {id}</p>
  </div>
</Card>
