import { useQueryClient } from '@tanstack/svelte-query';
import { createGetV1FeatureFlagsActive, getV1FeatureFlagsActiveQueryKey } from 'api-client';
import { onDestroy } from 'svelte';
import { browser } from '$app/environment';

type UseFeatureFlagsOptions = {
  /** Gates the fetch — no point querying when the user isn't logged in. */
  authenticated: boolean;
};

/**
 * Reactive feature-flag snapshot for the current user. Flags are evaluated
 * server-side against the user's roles and the dependency DAG, so consumers
 * just need to ask `flags.enabled('resumes.export.pdf')`.
 *
 * Bridging TanStack Svelte Query → Svelte 5 runes: `createGetV1FeatureFlagsActive`
 * returns a Svelte store. Reading it with `get(store)` is non-reactive in
 * `$derived`, so we subscribe explicitly and mirror the relevant fields into
 * a single `$state` object. The single-object shape matters: writing two
 * separate `$state` variables in one subscribe tick can let Svelte 5 flush
 * after the first assignment, so an effect that reads both can see a
 * half-updated snapshot (e.g. `isLoading=false` but `flags={}`), which makes
 * a `<FeatureRouteGuard>` redirect to dashboard before the flag arrives.
 */
export function useFeatureFlags(opts: () => UseFeatureFlagsOptions) {
  const queryClient = useQueryClient();
  // `enabled` is a function so TanStack re-evaluates it on each notify —
  // without this the gate is captured as a static boolean at hook-init time,
  // and a user who logs in after the page mounts never triggers the fetch.
  // BUT TanStack's QueryObserver only re-checks the function on existing
  // notifies — it won't proactively re-evaluate when an external reactive
  // input (`authenticated`) flips. We pair the function with an effect that
  // invalidates the query whenever auth transitions to true, so the fetch
  // actually fires.
  const query = createGetV1FeatureFlagsActive({
    query: {
      enabled: () => browser && opts().authenticated,
      staleTime: 5 * 60 * 1000,
    },
  });

  let lastAuth = false;
  $effect(() => {
    const auth = opts().authenticated;
    if (auth && !lastAuth && browser) {
      queryClient.invalidateQueries({ queryKey: getV1FeatureFlagsActiveQueryKey() });
    }
    lastAuth = auth;
  });

  // Single $state record. The subscribe callback assigns the whole record
  // atomically so an effect that reads `state.isLoading` and `state.flags`
  // always sees a consistent snapshot.
  //
  // `isLoading` here is "consumer still waiting for first flag snapshot",
  // not TanStack's `isLoading`. A query that's `enabled: false` reports
  // `isLoading: false` even though it never fetched — passing that through
  // would let `FeatureRouteGuard` decide the user is unauthorised before
  // the gate has had a chance to evaluate. We instead flip `isLoading` to
  // false only when a real success arrives (or when the query has explicitly
  // errored), so guards keep rendering their fallback during the disabled
  // window.
  let state = $state<{ isLoading: boolean; flags: Record<string, boolean> }>({
    isLoading: true,
    flags: {},
  });

  const unsubscribe = query.subscribe((value) => {
    const data = value.data as { flags?: Record<string, boolean> } | undefined;
    const settled = value.isSuccess || value.isError;
    state = {
      isLoading: !settled,
      flags: data?.flags ?? {},
    };
  });
  onDestroy(unsubscribe);

  return {
    get isLoading() {
      return state.isLoading;
    },
    get flags() {
      return state.flags;
    },
    /**
     * Returns true when the flag is effectively ON. An unknown key returns
     * false — fail-closed so removing a flag from the registry also hides
     * any stale UI references to it.
     */
    enabled(key: string): boolean {
      return state.flags[key] === true;
    },
  };
}

export { getV1FeatureFlagsActiveQueryKey };
