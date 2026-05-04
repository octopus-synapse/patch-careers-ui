import { type AuthSession200, createAuthSession } from 'api-client';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

function isAuthSession200(value: unknown): value is AuthSession200 {
  return typeof value === 'object' && value !== null && 'authenticated' in value;
}

/**
 * Centralized auth hook. All routes should use this instead of repeating
 * createAuthSession config. The generated SDK types `data` as a union of
 * 200 + 4xx response shapes; at runtime customFetch throws on non-2xx so
 * `data` is only ever the 200 shape when defined. We narrow once here so
 * consumers read `auth.data?.authenticated` and `auth.data?.user` against
 * a concrete type without local casts.
 */
export function useAuth() {
  const query = createAuthSession({ query: { retry: false, enabled: browser } });
  return {
    get data(): AuthSession200 | undefined {
      const d = get(query).data;
      return isAuthSession200(d) ? d : undefined;
    },
    get isLoading() {
      return get(query).isLoading;
    },
  };
}
