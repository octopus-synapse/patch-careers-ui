import { createGetV1UsersMePermissions } from 'api-client';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

type UsePermissionsOptions = {
  /** Whether the viewer is logged in; gates the fetch so anon pages stay lean. */
  authenticated: boolean;
};

/**
 * Reactive permission set for the current user. Small wrapper around the
 * generated query so UI code can do `perms.has('job:create')` without
 * re-implementing the query shape in every component.
 */
export function usePermissions(opts: () => UsePermissionsOptions) {
  const query = createGetV1UsersMePermissions({
    query: { enabled: browser && opts().authenticated, staleTime: 5 * 60 * 1000 },
  });

  return {
    get isLoading(): boolean {
      return get(query).isLoading;
    },
    get permissions(): string[] {
      const data = get(query).data as { permissions?: string[] } | undefined;
      return data?.permissions ?? [];
    },
    has(key: string): boolean {
      return this.permissions.includes(key);
    },
  };
}
