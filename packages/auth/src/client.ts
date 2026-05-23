/**
 * Token-based auth client.
 *
 * This module is the high-level surface most UI code calls — the
 * generated Kubb `useLogin` / `useRefresh` / etc. hooks are wrapped
 * here so callers get:
 *
 *   - automatic token persistence (success path writes to tokenStorage)
 *   - automatic Zustand store hydration (so navigation can react
 *     synchronously to auth state changes)
 *   - automatic header injection via `configureApiClient`
 *   - a singleton refresh queue (callers can fire-and-forget; concurrent
 *     refresh calls share the same in-flight Promise via `refreshOnce`)
 *
 * Wiring is done once at app boot via `configureAuthClient({ ... })` —
 * the host injects its `KeyValueStorage` instance (secure tier) and an
 * `apiBaseURL`. After that, calling `login()`, `logout()`, etc. Just
 * Works™ end-to-end.
 */
import {
  login as apiLogin,
  logout as apiLogout,
  session as apiSession,
  verify2Fa as apiVerify2Fa,
  configureApiClient,
  type FetcherError,
} from "@patch-careers/api-client";
import type { KeyValueStorage } from "@patch-careers/storage";
import { useAuthStore } from "./auth.store";
import { refreshOnce } from "./refresh-queue";
import { createTokenStorage, type TokenStorage } from "./token-storage";
import type { LoginResult, TokenPair, User } from "./types";

interface AuthClientRuntime {
  tokenStorage: TokenStorage | null;
  apiBaseURL: string;
  /** When true, send `Accept-Mode: tokens` on auth-mutating calls so
   * the backend returns the Bearer pair instead of a Set-Cookie. */
  preferTokens: boolean;
}

const runtime: AuthClientRuntime = {
  tokenStorage: null,
  apiBaseURL: "",
  preferTokens: true,
};

export interface ConfigureAuthClientOptions {
  storage: KeyValueStorage;
  apiBaseURL: string;
  /** Web hosts can opt out of token mode to stay cookie-based. Defaults
   * to `true` (universal Bearer flow per V2 D17). */
  preferTokens?: boolean;
}

/**
 * One-time wiring. Wires the fetcher's `getAuthHeader` + `refreshAuth`
 * callbacks AND constructs the token storage adapter against the
 * host-supplied `KeyValueStorage`. After this call, every Kubb hook
 * automatically gains 401 -> refresh -> retry behaviour.
 */
export function configureAuthClient(options: ConfigureAuthClientOptions): void {
  runtime.tokenStorage = createTokenStorage(options.storage);
  runtime.apiBaseURL = options.apiBaseURL;
  if (options.preferTokens !== undefined) runtime.preferTokens = options.preferTokens;

  configureApiClient({
    baseURL: options.apiBaseURL,
    getAuthHeader: async () => {
      const pair = await runtime.tokenStorage?.get();
      if (!pair) return null;
      return `Bearer ${pair.accessToken}`;
    },
    refreshAuth: async () => {
      const next = await refreshAccessToken();
      if (!next) return null;
      return `Bearer ${next.accessToken}`;
    },
    defaultHeaders: runtime.preferTokens ? { "Accept-Mode": "tokens" } : {},
  });
}

/** Test-only escape hatch — wipes the runtime back to defaults. */
export function resetAuthClient(): void {
  runtime.tokenStorage = null;
  runtime.apiBaseURL = "";
  runtime.preferTokens = true;
  useAuthStore.getState().reset();
}

function getTokenStorageOrThrow(): TokenStorage {
  if (!runtime.tokenStorage) {
    throw new Error(
      "@patch-careers/auth: configureAuthClient() must be called before any auth operation.",
    );
  }
  return runtime.tokenStorage;
}

function extractTokenPair(payload: unknown): TokenPair | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as {
    mode?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  };
  if (
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.expiresIn === "number"
  ) {
    return {
      accessToken: candidate.accessToken,
      refreshToken: candidate.refreshToken,
      expiresIn: candidate.expiresIn,
    };
  }
  return null;
}

function mapSessionUser(payload: unknown): User | null {
  if (!payload || typeof payload !== "object") return null;
  const u = (payload as { user?: Record<string, unknown> }).user;
  if (!u || typeof u !== "object") return null;
  const id = typeof u.id === "string" ? u.id : null;
  const email = typeof u.email === "string" ? u.email : null;
  if (!id || !email) return null;
  return {
    userId: id,
    email,
    name: typeof u.name === "string" ? u.name : null,
    username: typeof u.username === "string" ? u.username : null,
    emailVerified: u.emailVerified === true,
    isAdmin: u.isAdmin === true,
    hasCompletedOnboarding: u.hasCompletedOnboarding === true,
    needsEmailVerification: u.needsEmailVerification === true,
  };
}

/**
 * POST /v1/auth/login. On success persists tokens (if backend returned
 * the Bearer pair) and hydrates the Zustand store. Surfaces 2FA via
 * `LoginResult.twoFactorRequired` so the caller can route to the OTP
 * prompt before calling `verifyTwoFactor()`.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const tokenStorage = getTokenStorageOrThrow();
  useAuthStore.getState().setLoading(true);
  try {
    const data = await apiLogin({ email, password });
    const pair = extractTokenPair(data);
    if (pair) await tokenStorage.set(pair);
    return {
      userId: (data as { userId: string }).userId,
      twoFactorRequired: (data as { twoFactorRequired?: boolean }).twoFactorRequired === true,
    };
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}

/**
 * POST /v1/auth/login/verify-2fa. Same shape as `login()` — persists
 * tokens on success and clears the 2FA-required flag. `userId` is the
 * value returned by the preceding `login()` call (backend uses it to
 * scope the TOTP / backup-code check to the right pending session).
 */
export async function verifyTwoFactor(userId: string, code: string): Promise<LoginResult> {
  const tokenStorage = getTokenStorageOrThrow();
  useAuthStore.getState().setLoading(true);
  try {
    const data = await apiVerify2Fa({ userId, code });
    const pair = extractTokenPair(data);
    if (pair) await tokenStorage.set(pair);
    return {
      userId: (data as { userId: string }).userId,
      twoFactorRequired: false,
    };
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}

async function refreshAccessTokenRaw(): Promise<TokenPair> {
  const tokenStorage = runtime.tokenStorage;
  if (!tokenStorage) throw new Error("AUTH.NOT_CONFIGURED");
  const persisted = await tokenStorage.get();
  if (!persisted) {
    throw new Error("AUTH.NO_REFRESH_TOKEN");
  }
  // Bypass the fetcher's auto-401-refresh interceptor by calling fetch
  // directly. If /refresh itself comes back 401, the fetcher would
  // otherwise re-enter `runtime.refreshAuth` (= us) and await its own
  // in-flight Promise -> deadlock. Going around the fetcher entirely
  // is the simplest way to keep the refresh path single-pass.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (runtime.preferTokens) headers["Accept-Mode"] = "tokens";
  const response = await fetch(`${runtime.apiBaseURL}/api/v1/auth/refresh`, {
    method: "POST",
    headers,
    body: JSON.stringify({ refreshToken: persisted.refreshToken }),
  });
  if (!response.ok) {
    throw new Error(`AUTH.REFRESH_FAILED:${response.status}`);
  }
  const data = (await response.json()) as unknown;
  const pair = extractTokenPair(data);
  if (!pair) {
    // Cookie-mode response (mode='cookie', ok=true) — there's nothing
    // to persist locally; surface as a no-op so the caller knows the
    // current Bearer pair is now stale-but-unchanged.
    throw new Error("AUTH.REFRESH_RETURNED_COOKIE_MODE");
  }
  await tokenStorage.set(pair);
  return pair;
}

async function refreshAccessToken(): Promise<TokenPair | null> {
  const tokenStorage = runtime.tokenStorage;
  if (!tokenStorage) return null;
  return refreshOnce(refreshAccessTokenRaw);
}

/**
 * Public refresh entrypoint. UI callers can use this for "Try again"
 * flows after a 401 surfaced past the fetcher's auto-retry (e.g.
 * refresh itself failed once, then network came back).
 */
export async function refresh(): Promise<TokenPair> {
  const next = await refreshAccessToken();
  if (!next) throw new Error("AUTH.NOT_CONFIGURED");
  return next;
}

/**
 * POST /v1/auth/logout — invalidates server-side refresh token then
 * unconditionally clears local storage + store, even if the network
 * call fails (user wants out; we don't want a wedged auth state).
 */
export async function logout(): Promise<void> {
  const tokenStorage = getTokenStorageOrThrow();
  try {
    await apiLogout({});
  } catch {
    // Swallow — local logout must always succeed.
  }
  await tokenStorage.clear();
  useAuthStore.getState().reset();
}

/**
 * App-boot bootstrap. Pulls tokens from storage, validates them against
 * GET /v1/auth/session, hydrates the Zustand store. Returns the
 * resolved user (or null if no tokens / invalid tokens). Swallows 401
 * — those are an expected "user is logged out" signal, not an error.
 */
export async function bootstrap(): Promise<User | null> {
  const tokenStorage = getTokenStorageOrThrow();
  const persisted = await tokenStorage.get();
  if (!persisted) {
    useAuthStore.getState().setUser(null);
    return null;
  }

  useAuthStore.getState().setLoading(true);
  try {
    const data = await apiSession();
    const user = mapSessionUser(data);
    useAuthStore.getState().setUser(user);
    return user;
  } catch (err) {
    const fetcherErr = err as FetcherError;
    if (fetcherErr?.status === 401) {
      // Tokens invalid — clear them so next boot is clean.
      await tokenStorage.clear();
      useAuthStore.getState().setUser(null);
      return null;
    }
    // Network / 5xx — leave the tokens in place, surface to caller.
    throw err;
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}
