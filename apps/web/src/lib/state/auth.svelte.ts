import { createAuthSession } from 'api-client';
import { browser } from '$app/environment';

/**
 * Centralized auth hook. All routes should use this instead of
 * repeating createAuthSession config.
 *
 * After the customFetch unwrap, returns typed data directly:
 *   const auth = useAuth();
 *   const user = $derived(auth.data?.user);
 *   const authenticated = $derived(auth.data?.authenticated ?? false);
 */
export function useAuth() {
  return createAuthSession(() => ({ query: { retry: false, enabled: browser } }));
}
