<script lang="ts">
  import type { Snippet } from 'svelte';
  import FeatureRouteGuard from '$lib/components/feature-route-guard.svelte';

  const { children }: { children: Snippet } = $props();
</script>

<FeatureRouteGuard flag="social">
  {@render children()}
</FeatureRouteGuard>
