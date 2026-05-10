<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query';
  import { getV1FeatureFlagsActiveQueryKey } from 'api-client';
  import { useSseSubscribe } from '$lib/state/use-sse-subscribe.svelte';

  const queryClient = useQueryClient();

  // Parent (`feature-flags-stream.svelte`) mounts this only when the user is
  // authenticated, so `enabled: true` is captured on mount and the connection
  // tears down on unmount.
  useSseSubscribe('/v1/feature-flags/stream', {
    queryClient,
    invalidateKeys: [getV1FeatureFlagsActiveQueryKey()],
    enabled: true,
  });
</script>
