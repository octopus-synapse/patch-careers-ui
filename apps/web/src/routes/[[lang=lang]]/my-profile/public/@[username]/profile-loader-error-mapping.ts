import { error } from '@sveltejs/kit';
import { type ApiError, isApiError } from 'api-client';

export type ProfileLoaderResult = { profile: unknown | null };

/**
 * Maps SDK errors thrown by the public-profile loader into the right load()
 * outcome (return-vs-throw, status code).
 *
 *   - 404 → return { profile: null } so the page renders its own
 *     "not found" UI instead of SvelteKit's generic error page.
 *   - 410 → throw 410 Gone so crawlers drop the URL from their index
 *     (covers profiles deliberately removed under LGPD).
 *   - Anything else (401/403 misconfigured ingress, 500 upstream outage,
 *     network) re-throws unchanged and SvelteKit renders the
 *     +error.svelte boundary.
 *
 * P1 #31 fix: previously 401/403 were silently rewritten to 404, which
 * masked a real auth-misconfig from the ops dashboard and made every
 * production outage look like "user not found" — same UI for "ghost
 * username", "broken auth gateway" and "backend down".
 */
export function mapProfileLoadError(err: unknown): ProfileLoaderResult {
  if (isApiError(err as ApiError)) {
    const apiErr = err as ApiError;
    if (apiErr.statusCode === 404) return { profile: null };
    if (apiErr.statusCode === 410) throw error(410, 'profile removed');
  }
  throw err;
}
