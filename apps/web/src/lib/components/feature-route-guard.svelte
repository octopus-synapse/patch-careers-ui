<script lang="ts">
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { useAuth } from '$lib/state/auth.svelte';
  import { useFeatureFlags } from '$lib/state/feature-flags.svelte';

  /**
   * Wraps a route so it disappears when its feature flag is OFF.
   *
   * Why a component instead of a load() hook: this app is CSR-only
   * (src/routes/+layout.ts has `ssr = false`), so guards run on the
   * client anyway. A component also lets us wait for the flag query
   * to hydrate before deciding — no false-negative redirect during
   * the first paint.
   *
   * When the flag resolves to OFF we redirect to `redirectTo`
   * (default: `/my-profile/dashboard`) instead of 404 so the user
   * lands somewhere useful.
   */
  type Props = {
    flag: string;
    children: Snippet;
    redirectTo?: string;
  };

  const { flag, children, redirectTo = '/my-profile/dashboard' }: Props = $props();

  const auth = useAuth();
  const authenticated = $derived(auth.data?.authenticated ?? false);
  const flags = useFeatureFlags(() => ({ authenticated }));

  // Only decide once the flag snapshot has loaded — otherwise we'd
  // redirect every guarded route while flags.isLoading is still true.
  const decided = $derived(!flags.isLoading);
  const enabled = $derived(flags.enabled(flag));

  $effect(() => {
    if (!browser) return;
    if (!authenticated) return; // let the page's own auth guard handle it
    if (!decided) return;
    if (!enabled) {
      goto(redirectTo, { replaceState: true });
    }
  });
</script>

{#if !decided || enabled}
  {@render children()}
{/if}
