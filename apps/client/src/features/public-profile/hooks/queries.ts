/**
 * Data layer for the public profile page.
 *
 * A 404 here is a normal outcome, not a failure: usernames are guessable and
 * profiles can be private. So the query does not retry — retrying a definitive
 * "no such person" three times only delays the empty state — and the screen
 * separates "not found" from "the request broke".
 *
 * The query also waits for `hasBootstrapped`. That is not about permission —
 * the endpoint is public — but about the API base URL: `AuthProvider` calls
 * `configureAuthClient` in an effect, and React runs a child's effects BEFORE
 * its parent's. Every other screen in the app sits behind an auth gate that
 * already waits for this, so the race was invisible; a route that mounts its
 * own query on first paint fires while `runtime.baseURL` is still "", the
 * request goes to the Metro dev server as a relative path, and the "profile"
 * that comes back is index.html.
 */

import { useGetV1ProfilesUsername } from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { useAuthBootstrap } from "@/providers/auth-provider";
import type { PublicProfileResponse } from "../types";

export type UsePublicProfileResult = {
  profile: PublicProfileResponse | undefined;
  isLoading: boolean;
  /** The username does not resolve (404), or is missing from the URL. */
  isNotFound: boolean;
  /** Anything else went wrong — worth a retry button. */
  isError: boolean;
  refetch: () => void;
};

/** HTTP status carried on the generated fetcher's rejection. */
function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const withStatus = error as { status?: unknown; response?: { status?: unknown } };
  const raw = withStatus.status ?? withStatus.response?.status;
  return typeof raw === "number" ? raw : undefined;
}

/**
 * `locale` is the language VERSION of the résumé prose (ADR-0011): the page
 * at `/u/…` asks for Portuguese, `/en/u/…` for English. The server falls
 * back to the text as written when that version does not exist yet.
 */
export function usePublicProfile(
  username: string | undefined,
  locale: Locale,
): UsePublicProfileResult {
  const { hasBootstrapped } = useAuthBootstrap();
  const ready = Boolean(username) && hasBootstrapped;
  const query = useGetV1ProfilesUsername(
    username ?? "",
    { locale },
    { query: { enabled: ready, retry: false } },
  );
  const status = statusOf(query.error);
  const isNotFound = !username || (query.isError && (status === 404 || status === 400));

  return {
    profile: query.data,
    isLoading: Boolean(username) && (!hasBootstrapped || query.isLoading),
    isNotFound,
    isError: query.isError && !isNotFound,
    refetch: () => void query.refetch(),
  };
}
