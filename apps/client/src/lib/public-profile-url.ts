/**
 * The public profile URL — one shape, one place.
 *
 * It was in two places and they disagreed with each other and with reality:
 * the onboarding username step previewed `patchcareers.com/@handle`, the
 * production domain is `patchcareers.org`, and the route we serve is `/u/`.
 * A user who copied what onboarding showed them got a dead link on a domain
 * we don't own.
 *
 * On web the origin is read live from `window.location`, so dev
 * (localhost:8081) and production resolve without configuration — the same
 * trick `oauthWebCallbackUrl()` in `config/api.ts` uses. Native has no
 * `window`, and the onboarding preview runs there, so it falls back to the
 * production origin.
 */

/**
 * Production web origin. Only reached when there is no live origin to read
 * (native), because the value is otherwise derived.
 */
const FALLBACK_ORIGIN = "https://patchcareers.org";

/** The route segment. Must match `app/u/[username].tsx`. */
export const PUBLIC_PROFILE_SEGMENT = "u";

/** The live web origin, or the production one when there isn't a live one. */
export function publicWebOrigin(): string {
  const origin = typeof window !== "undefined" ? window.location?.origin : undefined;
  return origin && origin.length > 0 ? origin : FALLBACK_ORIGIN;
}

/** Full URL, protocol included — what goes on the clipboard. */
export function publicProfileUrl(username: string): string {
  return `${publicWebOrigin()}/${PUBLIC_PROFILE_SEGMENT}/${username}`;
}

/**
 * The same URL without the protocol — what gets rendered. `https://` is noise
 * in a card whose whole job is to be recognised and copied.
 */
export function publicProfileDisplayUrl(username: string): string {
  return publicProfileUrl(username).replace(/^https?:\/\//, "");
}
