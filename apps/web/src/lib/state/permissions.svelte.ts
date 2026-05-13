import { useQueryClient } from '@tanstack/svelte-query';
import { createGetV1UsersMePermissions, getV1UsersMePermissionsQueryKey } from 'api-client';
import { onDestroy } from 'svelte';
import { browser } from '$app/environment';

type UsePermissionsOptions = {
  /** Whether the viewer is logged in; gates the fetch so anon pages stay lean. */
  authenticated: boolean;
};

/**
 * Reactive permission set for the current user. Small wrapper around the
 * generated query so UI code can do `perms.has('job:create')` without
 * re-implementing the query shape in every component.
 *
 * Bridging TanStack Svelte Query → Svelte 5 runes: same pattern as
 * `useAuth` / `useFeatureFlags`. The TanStack store is non-reactive in
 * `$derived`, so we subscribe explicitly and mirror the snapshot into
 * a single `$state` record. `isLoading` is only flipped to false once
 * a real success / error arrives — a query that's `enabled: false`
 * reports `isLoading: false` even though it never fetched, and guards
 * that key off it would decide the user lacks a permission before the
 * call has had a chance to run.
 */
export function usePermissions(opts: () => UsePermissionsOptions) {
  const queryClient = useQueryClient();
  const query = createGetV1UsersMePermissions({
    query: {
      enabled: () => browser && opts().authenticated,
      staleTime: 5 * 60 * 1000,
    },
  });

  let state = $state<{ isLoading: boolean; permissions: string[] }>({
    isLoading: true,
    permissions: [],
  });

  const unsubscribe = query.subscribe((value) => {
    const data = value.data as { permissions?: string[] } | undefined;
    const settled = value.isSuccess || value.isError;
    state = {
      isLoading: !settled,
      permissions: data?.permissions ?? [],
    };
  });
  onDestroy(unsubscribe);

  // TanStack's QueryObserver doesn't proactively re-evaluate a function
  // `enabled` when an outside reactive input flips — force a refetch when
  // auth transitions to true so the query actually fires.
  let lastAuth = false;
  $effect(() => {
    const auth = opts().authenticated;
    if (auth && !lastAuth && browser) {
      queryClient.invalidateQueries({ queryKey: getV1UsersMePermissionsQueryKey() });
    }
    lastAuth = auth;
  });

  return {
    get isLoading(): boolean {
      return state.isLoading;
    },
    get permissions(): string[] {
      return state.permissions;
    },
    has(key: string): boolean {
      return state.permissions.includes(key);
    },
  };
}
