/**
 * Single-flight refresh primitive.
 *
 * Mirrors the same shape the api-client fetcher uses internally
 * (`runRefreshOnce`). We expose this here so the auth client can apply
 * the same guarantee to its own refresh() entrypoint (manual UI-driven
 * refreshes, e.g. "Try again" button after a logout), and so tests can
 * verify the contract in isolation.
 *
 * Contract:
 *   - First caller starts the operation.
 *   - Concurrent callers (while it's pending) share the same Promise —
 *     no second invocation of the underlying op.
 *   - Both success AND failure clear the in-flight slot synchronously on
 *     settle so the next caller can retry; the failure rejection is
 *     forwarded to every awaiter that piled up.
 */
import type { TokenPair } from "./types";

let inFlight: Promise<TokenPair> | null = null;

export async function refreshOnce(doRefresh: () => Promise<TokenPair>): Promise<TokenPair> {
  if (inFlight) return inFlight;
  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Test-only reset hook. Wipes the singleton slot. */
export function __resetRefreshQueue(): void {
  inFlight = null;
}

/** Observability helper — exposed for tests / debug only. */
export function isRefreshInFlight(): boolean {
  return inFlight !== null;
}
