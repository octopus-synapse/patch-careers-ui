import { error } from '@sveltejs/kit';
import { getV1ProfilesUsername, isApiError } from 'api-client';
import type { PageServerLoad } from './$types';

// Public profiles are the deepest indexable surface in the app — Google
// crawls them for resume + skills + activity content, and an empty CSR
// shell is worthless to rankings. Override the layout's `ssr = false`
// and prefetch the profile server-side so the initial HTML carries the
// real name, bio, headline, photo URL, and JSON-LD `Person` schema that
// `<SeoHead>` emits.
export const ssr = true;

export const load: PageServerLoad = async ({ params }) => {
  const username = params.username;
  if (!username) {
    throw error(400, 'username param missing');
  }

  try {
    // The Kubb-generated client honours `baseURL` per-call. Pass the
    // build-time `VITE_API_URL` directly — `setBaseUrl` only runs in
    // the layout's <script>, which executes AFTER this server `load`,
    // so the module-level baseUrl is still its hard-coded default
    // when we get here.
    const profile = await getV1ProfilesUsername(username, {
      baseURL: import.meta.env.VITE_API_URL,
    });
    return { profile };
  } catch (err) {
    if (isApiError(err) && err.statusCode === 404) {
      throw error(404, 'profile not found');
    }
    throw err;
  }
};
