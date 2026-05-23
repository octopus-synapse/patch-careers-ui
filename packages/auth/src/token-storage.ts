/**
 * Secure-storage wrapper for the auth token triple
 * (`accessToken`, `refreshToken`, `tokenExpiresAt`).
 *
 * Backed by `@patch-careers/storage` `secure` adapter (expo-secure-store
 * on mobile, sessionStorage on web — see storage package for why web has
 * no true secure tier). Async because mobile secure-store is async; web
 * adapter wraps sync calls in resolved promises.
 *
 * `tokenExpiresAt` is persisted as an absolute ms-epoch (computed from
 * the backend-reported `expiresIn` at write time) so consumers don't
 * need to track a separate "issued at" clock.
 */
import type { KeyValueStorage } from "@patch-careers/storage";
import type { TokenPair } from "./types";

export const TOKEN_KEYS = {
  accessToken: "patch-careers:auth:accessToken",
  refreshToken: "patch-careers:auth:refreshToken",
  expiresAt: "patch-careers:auth:tokenExpiresAt",
} as const;

export interface PersistedTokenPair extends TokenPair {
  /** Absolute ms-epoch the access token expires. */
  expiresAt: number;
}

export interface TokenStorage {
  get(): Promise<PersistedTokenPair | null>;
  set(pair: TokenPair): Promise<void>;
  clear(): Promise<void>;
}

export function createTokenStorage(storage: KeyValueStorage): TokenStorage {
  return {
    async get(): Promise<PersistedTokenPair | null> {
      const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
        storage.getItem(TOKEN_KEYS.accessToken),
        storage.getItem(TOKEN_KEYS.refreshToken),
        storage.getItem(TOKEN_KEYS.expiresAt),
      ]);
      if (!accessToken || !refreshToken) return null;
      const expiresAt = expiresAtRaw ? Number.parseInt(expiresAtRaw, 10) : 0;
      // expiresIn at-rest is derived from expiresAt - now; keep the
      // server-reported field round-trippable so callers that only need
      // the pair-shape don't have to recompute.
      const expiresIn = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      return { accessToken, refreshToken, expiresIn, expiresAt };
    },
    async set(pair: TokenPair): Promise<void> {
      const expiresAt = Date.now() + pair.expiresIn * 1000;
      await Promise.all([
        storage.setItem(TOKEN_KEYS.accessToken, pair.accessToken),
        storage.setItem(TOKEN_KEYS.refreshToken, pair.refreshToken),
        storage.setItem(TOKEN_KEYS.expiresAt, String(expiresAt)),
      ]);
    },
    async clear(): Promise<void> {
      await Promise.all([
        storage.removeItem(TOKEN_KEYS.accessToken),
        storage.removeItem(TOKEN_KEYS.refreshToken),
        storage.removeItem(TOKEN_KEYS.expiresAt),
      ]);
    },
  };
}
