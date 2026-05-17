import { createSession, type Session200 } from 'api-client';
import { onDestroy } from 'svelte';
import { browser } from '$app/environment';

function isAuthSession200(value: unknown): value is Session200 {
  return typeof value === 'object' && value !== null && 'user' in value;
}

// Last known authenticated userId, captured every time `useAuth()` sees
// a non-anonymous session. Read by the global 401 handler so we can
// wipe the outgoing user's per-namespace localStorage even after the
// session query has reset to `undefined`.
let lastKnownUserId: string | undefined;

export function getLastKnownUserId(): string | undefined {
  return lastKnownUserId;
}

/**
 * Centralized auth hook. The single point in the app that knows the shape
 * of `Session200`. Components consume the derived booleans / fields below;
 * if the backend reshapes the session payload, only this file changes.
 *
 * Bridging TanStack Svelte Query → Svelte 5 runes: `createSession` returns
 * a Svelte store. Reading it with `get(store)` is non-reactive in `$derived`,
 * so we subscribe explicitly and mirror the relevant fields into `$state`
 * variables. Consumers can then keep their `$derived(session.user)` pattern
 * and it stays reactive — without forcing every callsite to learn the
 * `$store` auto-subscribe sigil for a hook that nominally returns an object.
 */
export function useAuth() {
  const query = createSession({ query: { retry: false, enabled: browser } });

  let session = $state<Session200 | undefined>(undefined);
  let isLoading = $state(true);

  const unsubscribe = query.subscribe((value) => {
    const d = value.data;
    session = isAuthSession200(d) ? d : undefined;
    isLoading = value.isLoading;
    const id = session?.user?.id;
    if (id) lastKnownUserId = id;
  });
  onDestroy(unsubscribe);

  return {
    get user() {
      return session?.user;
    },
    get userId() {
      return session?.user?.id;
    },
    get isAuthenticated() {
      return !!session?.user;
    },
    get isAdmin() {
      return session?.user?.isAdmin ?? false;
    },
    get needsOnboarding() {
      return session?.user?.needsOnboarding ?? false;
    },
    get needsEmailVerification() {
      return session?.user?.needsEmailVerification ?? false;
    },
    get hasCompletedOnboarding() {
      return session?.user?.hasCompletedOnboarding ?? false;
    },
    get isLoading() {
      return isLoading;
    },
  };
}
