<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useFeatureFlags } from '$lib/state/feature-flags.svelte';
  import { useAuth } from '$lib/state/auth.svelte';

  type Props = {
    flag: string;
    children: Snippet;
    fallback?: Snippet;
  };

  const { flag, children, fallback }: Props = $props();

  const auth = useAuth();
  const authenticated = $derived(auth.isAuthenticated ?? false);
  const flags = useFeatureFlags(() => ({ authenticated }));
  const visible = $derived(flags.enabled(flag));
</script>

{#if visible}
  {@render children()}
{:else if fallback}
  {@render fallback()}
{/if}
