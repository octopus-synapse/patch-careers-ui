import { error } from '@sveltejs/kit';
import { getV1ProfilesUsername } from 'api-client';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';
import { mapProfileLoadError, type ProfileLoaderResult } from './profile-loader-error-mapping';

// Public profiles are the deepest indexable surface in the app — Google
// crawls them for resume + skills + activity content. SSR is on now by
// default at the root layout (P0-#24 doctrine inversion).
export const ssr = true;

/**
 * P0-#22: previously this called the SDK with
 *   `baseURL: import.meta.env.VITE_API_URL`
 *
 * `VITE_API_URL` is a Vite client-side variable — statically inlined at
 * build time from `.env.development` (default: `http://localhost:13001`).
 * In server-side rendering on a deployed container that string was baked
 * into the bundle, so the SSR load tried to reach `http://localhost:13001`
 * from inside the container and 500'd. Worse, even when correctly set at
 * build time, the value was static — the deploy couldn't override per-env.
 *
 * Fix: prefer `INTERNAL_API_URL` from `$env/dynamic/private` (read at
 * runtime, never inlined, only available server-side). Fall back to the
 * existing PUBLIC_API_URL / VITE_API_URL chain for local dev where the
 * private var isn't set. The private var is the production source of truth.
 */
function resolveServerApiBase(): string {
  if (privateEnv.INTERNAL_API_URL) return privateEnv.INTERNAL_API_URL;
  if (publicEnv.PUBLIC_API_URL) return publicEnv.PUBLIC_API_URL;
  // Last-resort dev fallback. Still wrong for production but at least
  // matches the historical behaviour while a deploy is being configured.
  return import.meta.env.VITE_API_URL ?? 'http://localhost:13001';
}

export const load: PageServerLoad = async ({ params }) => {
  const username = params.username;
  if (!username) {
    throw error(400, 'username param missing');
  }

  try {
    const profile = await getV1ProfilesUsername(username, {
      baseURL: resolveServerApiBase(),
    });
    return { profile } satisfies ProfileLoaderResult;
  } catch (err) {
    return mapProfileLoadError(err);
  }
};
