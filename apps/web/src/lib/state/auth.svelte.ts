import { createSession, type Session200 } from 'api-client';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

function isAuthSession200(value: unknown): value is Session200 {
  return typeof value === 'object' && value !== null && 'user' in value;
}

/**
 * Centralized auth hook. The single point in the app that knows the shape
 * of `Session200`. Components consume the derived booleans / fields below;
 * if the backend reshapes the session payload, only this file changes.
 *
 * The SDK types `query.data` as a union of 200 + 4xx response shapes, but
 * the custom fetcher throws on non-2xx, so `data` is either undefined or
 * the 200 shape at runtime. The runtime narrow happens once here.
 */
export function useAuth() {
  const query = createSession({ query: { retry: false, enabled: browser } });
  const session = (): Session200 | undefined => {
    const d = get(query).data;
    return isAuthSession200(d) ? d : undefined;
  };
  return {
    get user() {
      return session()?.user;
    },
    get userId() {
      return session()?.user?.id;
    },
    get isAuthenticated() {
      return !!session()?.user;
    },
    get isAdmin() {
      return session()?.user?.isAdmin ?? false;
    },
    get needsOnboarding() {
      return session()?.user?.needsOnboarding ?? false;
    },
    get needsEmailVerification() {
      return session()?.user?.needsEmailVerification ?? false;
    },
    get hasCompletedOnboarding() {
      return session()?.user?.hasCompletedOnboarding ?? false;
    },
    get isLoading() {
      return get(query).isLoading;
    },
  };
}
