<script lang="ts">
  import { Button, Modal } from 'ui';
  import { goto } from '$app/navigation';
  import { dismissLockout, lockoutStore } from '$lib/state/lockout-state.svelte';

  const current = $derived(lockoutStore.current);

  function handleCta(): void {
    const cta = current?.cta;
    dismissLockout();
    if (cta) void goto(cta.href);
  }
</script>

{#snippet titleSlot()}
  <span>{current?.title ?? ''}</span>
{/snippet}

{#if current}
  <Modal open={true} onClose={dismissLockout} title={titleSlot}>
    <div class="space-y-4 p-4 text-sm text-neutral-700 dark:text-neutral-200">
      <p>{current.body}</p>
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={dismissLockout}>Fechar</Button>
        {#if current.cta}
          <Button variant="solid" size="sm" onclick={handleCta}>
            {current.cta.label}
          </Button>
        {/if}
      </div>
    </div>
  </Modal>
{/if}
