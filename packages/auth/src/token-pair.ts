/**
 * Shared TokenPair construction/validation.
 *
 * Both the auth client (login / verify-2fa / refresh response bodies) and
 * the OAuth callback handler (query-string params) need to turn an
 * untrusted payload into a `TokenPair`, with the same field set and
 * guards. Keeping the logic here means there's one definition to maintain.
 */
import type { TokenPair } from "./types";

/**
 * Validates/constructs a `TokenPair` from an arbitrary backend payload.
 * Returns `null` when the `accessToken`/`refreshToken`/`expiresIn` triple
 * isn't present with the expected types.
 */
export function extractTokenPair(payload: unknown): TokenPair | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as {
    accessToken?: unknown;
    refreshToken?: unknown;
    expiresIn?: unknown;
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

/**
 * Builds a `TokenPair` from OAuth callback query params
 * (`?accessToken=…&refreshToken=…&expiresIn=…`). Returns `null` when any
 * part is missing or `expiresIn` doesn't parse to a number.
 */
export function parseTokenPairFromParams(params: URLSearchParams): TokenPair | null {
  const accessToken = params.get("accessToken");
  const refreshToken = params.get("refreshToken");
  const expiresInRaw = params.get("expiresIn");
  if (!accessToken || !refreshToken || !expiresInRaw) return null;
  const expiresIn = Number.parseInt(expiresInRaw, 10);
  if (Number.isNaN(expiresIn)) return null;
  return { accessToken, refreshToken, expiresIn };
}
