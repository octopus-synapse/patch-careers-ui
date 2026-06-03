/**
 * Generic single-flight primitive.
 *
 * Collapses concurrent invocations of an async operation onto a single
 * in-flight Promise: the first caller starts the op, callers that arrive
 * while it is pending share that Promise (the underlying op runs once),
 * and once it settles — success OR failure — the slot is cleared so the
 * next caller triggers a fresh attempt. The rejection is forwarded to
 * every awaiter that piled up.
 *
 * The slot is cleared on the next microtask (not synchronously on settle)
 * so awaiters that resolve synchronously all observe the same Promise
 * before a fresh flight can begin.
 *
 * Consumed by the auth refresh-queue and the api-client fetcher to dedupe
 * token refreshes triggered by concurrent 401s.
 */
export interface SingleFlight<T> {
  /** Run `op` under the single-flight guard, or join the pending run. */
  run(op: () => Promise<T>): Promise<T>;
  /** Clear the in-flight slot immediately (test/debug escape hatch). */
  reset(): void;
  /** Whether an operation is currently in flight. */
  isInFlight(): boolean;
}

export function singleFlight<T>(): SingleFlight<T> {
  let inFlight: Promise<T> | null = null;
  return {
    run(op) {
      if (inFlight) return inFlight;
      inFlight = (async () => {
        try {
          return await op();
        } finally {
          queueMicrotask(() => {
            inFlight = null;
          });
        }
      })();
      return inFlight;
    },
    reset() {
      inFlight = null;
    },
    isInFlight() {
      return inFlight !== null;
    },
  };
}
