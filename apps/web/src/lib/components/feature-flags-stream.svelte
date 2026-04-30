<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
  import { useAuth } from '$lib/state/auth.svelte';

  import Inner from './feature-flags-stream-inner.svelte';

  const auth = useAuth();
  const authenticated = $derived(auth.data?.authenticated ?? false);
</script>

{#if authenticated}
  <Inner />
{/if}
