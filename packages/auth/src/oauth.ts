/**
 * OAuth (GitHub / LinkedIn) helpers.
 *
 * Implementation notes:
 *   - Backend OAuth start endpoints accept `?redirect_uri=...` per the
 *     allowlist in `OAUTH_REDIRECT_URI_ALLOWLIST` (profile-services).
 *     For the Expo app we send `patchcareers://auth/callback`.
 *   - On mobile we use `expo-auth-session` to drive the system browser
 *     (or in-app browser tab) — imported dynamically so the web build
 *     doesn't pull in the native shim.
 *   - On web we just `window.location.href = startUrl` and let the
 *     normal browser redirect flow handle it.
 *   - Either way, the callback URL receives `?accessToken=...&refreshToken=...&expiresIn=...`
 *     in the fragment / query. The host's deep-link handler parses
 *     those and forwards them to `completeOAuth()` here.
 */
import { configureApiClient } from "@patch-careers/api-client";
import type { KeyValueStorage } from "@patch-careers/storage";
import { useAuthStore } from "./auth.store";
import { createTokenStorage, type TokenStorage } from "./token-storage";
import type { TokenPair } from "./types";

export type OAuthProvider = "github" | "linkedin";

export interface OAuthStartOptions {
  apiBaseURL: string;
  redirectUri: string;
  /** Optional state parameter forwarded to the backend's CSRF check. */
  state?: string;
}

export function buildOAuthStartUrl(provider: OAuthProvider, options: OAuthStartOptions): string {
  const base = options.apiBaseURL.replace(/\/+$/, "");
  const params = new URLSearchParams();
  params.set("redirect_uri", options.redirectUri);
  if (options.state) params.set("state", options.state);
  return `${base}/api/v1/auth/oauth/${provider}/start?${params.toString()}`;
}

/**
 * Web-side launcher: navigates the current tab to the backend's OAuth
 * start URL. The backend handles provider redirect + callback and
 * eventually bounces back to `redirectUri` with the token triple in the
 * query string.
 */
export function signInWithProviderWeb(provider: OAuthProvider, options: OAuthStartOptions): void {
  if (typeof window === "undefined") {
    throw new Error(
      "signInWithProviderWeb called outside a browser context — use signInWithProviderNative on RN.",
    );
  }
  window.location.href = buildOAuthStartUrl(provider, options);
}

/**
 * Native launcher placeholder. The real implementation uses
 * `expo-auth-session.startAsync({ authUrl, returnUrl })` — kept as a
 * thin pluggable callback here so this package doesn't take a hard
 * dependency on `expo-auth-session` (only the host Expo app needs it).
 *
 * The host wires this at boot via `configureOAuthLauncher(launcher)`.
 */
export type OAuthLauncher = (
  authUrl: string,
  returnUrl: string,
) => Promise<{ type: "success" | "cancel" | "dismiss"; url?: string }>;

let nativeLauncher: OAuthLauncher | null = null;

export function configureOAuthLauncher(launcher: OAuthLauncher | null): void {
  nativeLauncher = launcher;
}

export async function signInWithProviderNative(
  provider: OAuthProvider,
  options: OAuthStartOptions,
): Promise<{ ok: boolean; url?: string }> {
  if (!nativeLauncher) {
    throw new Error(
      "signInWithProviderNative: configure an OAuth launcher first via configureOAuthLauncher().",
    );
  }
  const authUrl = buildOAuthStartUrl(provider, options);
  const result = await nativeLauncher(authUrl, options.redirectUri);
  // Avoid emitting `url: undefined` literally (exactOptionalPropertyTypes
  // distinguishes "missing key" from "key set to undefined").
  return result.url !== undefined
    ? { ok: result.type === "success", url: result.url }
    : { ok: result.type === "success" };
}

/**
 * Convenience for the deep-link callback handler. Parses the standard
 * `?accessToken=...&refreshToken=...&expiresIn=...` payload, persists
 * it, and wires the headers into the api-client so subsequent requests
 * are authenticated.
 *
 * The host is expected to call this from its deep-link handler (Expo
 * `Linking.addEventListener('url', ...)` on RN, or the post-redirect
 * page on web).
 */
export async function completeOAuth(
  callbackUrl: string,
  storage: KeyValueStorage,
  apiBaseURL: string,
): Promise<TokenPair | null> {
  const url = new URL(callbackUrl);
  const accessToken = url.searchParams.get("accessToken");
  const refreshToken = url.searchParams.get("refreshToken");
  const expiresInRaw = url.searchParams.get("expiresIn");
  if (!accessToken || !refreshToken || !expiresInRaw) return null;
  const expiresIn = Number.parseInt(expiresInRaw, 10);
  if (Number.isNaN(expiresIn)) return null;

  const pair: TokenPair = { accessToken, refreshToken, expiresIn };
  const tokenStorage: TokenStorage = createTokenStorage(storage);
  await tokenStorage.set(pair);

  // Make sure subsequent requests pick up the new token even if
  // configureAuthClient() ran before the OAuth dance kicked off.
  configureApiClient({
    baseURL: apiBaseURL,
    getAuthHeader: async () => {
      const persisted = await tokenStorage.get();
      if (!persisted) return null;
      return `Bearer ${persisted.accessToken}`;
    },
  });

  // Optimistically flag the user as authenticated — the host should
  // call bootstrap() next to hydrate the user object.
  useAuthStore.getState().setUser(useAuthStore.getState().currentUser);

  return pair;
}
