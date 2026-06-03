/**
 * Single-flight refresh primitive for the auth client's manual refresh
 * entrypoint (UI-driven refreshes, e.g. a "Try again" button).
 *
 * Backed by the shared `singleFlight` from `@patch-careers/platform` — the
 * same primitive the api-client fetcher uses for its 401-triggered refresh.
 *
 * Contract:
 *   - First caller starts the operation.
 *   - Concurrent callers (while it's pending) share the same Promise —
 *     no second invocation of the underlying op.
 *   - Both success AND failure clear the in-flight slot (on the next
 *     microtask) so the next caller can retry; the rejection is forwarded
 *     to every awaiter that piled up.
 */
import { singleFlight } from "@patch-careers/platform";
import type { TokenPair } from "./types";

const flight = singleFlight<TokenPair>();

export function refreshOnce(doRefresh: () => Promise<TokenPair>): Promise<TokenPair> {
  return flight.run(doRefresh);
}

/** Test-only reset hook. Wipes the singleton slot. */
export function __resetRefreshQueue(): void {
  flight.reset();
}

/** Observability helper — exposed for tests / debug only. */
export function isRefreshInFlight(): boolean {
  return flight.isInFlight();
}
