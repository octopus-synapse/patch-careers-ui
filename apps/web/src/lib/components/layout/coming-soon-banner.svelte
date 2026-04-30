<script lang="ts">
  /**
   * Drop-in replacement for admin pages whose backend endpoint is not
   * shipped yet. Renders a compact card that explains the placeholder
   * status without leaking stub UI to users.
   */
  interface Props {
    title: string;
    description?: string;
    eta?: string;
  }
  const { title, description, eta }: Props = $props();
</script>

<section class="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
  <div class="mx-auto flex max-w-md flex-col items-center gap-3">
    <span
      class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
    >
      Em breve
    </span>
    <h2 class="text-lg font-semibold text-foreground">{title}</h2>
    {#if description}
      <p class="text-sm text-muted-foreground">{description}</p>
    {/if}
    {#if eta}
      <p class="text-xs text-muted-foreground">ETA: {eta}</p>
    {/if}
  </div>
</section>
