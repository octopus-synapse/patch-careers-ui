<script lang="ts">
  import { useAuth } from '$lib/state/auth.svelte';

  import Inner from './feature-flags-stream-inner.svelte';

  const auth = useAuth();
  const authenticated = $derived(auth.isAuthenticated ?? false);
</script>

{#if authenticated}
  <Inner />
{/if}
