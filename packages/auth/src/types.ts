/**
 * Domain types shared across the auth package. Mirrors the backend
 * contract (Session200 / Login200 / Refresh201) but flattened to what
 * the host app actually persists / observes — keeps the rest of the
 * package decoupled from generated Kubb typings.
 */

export interface User {
  userId: string;
  email: string;
  name: string | null;
  username: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
  hasCompletedOnboarding: boolean;
  needsEmailVerification: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires (server clock). */
  expiresIn: number;
}

export interface LoginResult {
  userId: string;
  /** True if backend gated login behind a TOTP / backup code prompt. */
  twoFactorRequired: boolean;
  /**
   * Present when the backend authenticated the session but did not return
   * a Bearer pair inline (mobile `Accept-Mode: tokens`). Call
   * `exchangeSessionForTokens()` before `bootstrap()`.
   */
  sessionExchangeId?: string;
}
