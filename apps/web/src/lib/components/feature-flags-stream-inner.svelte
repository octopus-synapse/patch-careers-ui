<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
  import { useQueryClient } from '@tanstack/svelte-query';
  import { getFeatureFlagsEvaluateQueryKey } from 'api-client';
  import { useSseSubscribe } from '$lib/state/use-sse-subscribe.svelte';

  const queryClient = useQueryClient();

  // Parent (`feature-flags-stream.svelte`) mounts this only when the user is
  // authenticated, so `enabled: true` is captured on mount and the connection
  // tears down on unmount.
  useSseSubscribe('/v1/feature-flags/stream', {
    queryClient,
    invalidateKeys: [getFeatureFlagsEvaluateQueryKey()],
    enabled: true,
  });
</script>
