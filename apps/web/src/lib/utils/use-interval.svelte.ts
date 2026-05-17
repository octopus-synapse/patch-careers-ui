/**
 * Rune-friendly `setInterval` wrapper with automatic cleanup.
 *
 * Drop-in alternative to the `setInterval` + `onDestroy` pattern that
 * leaks timers when a component reactively swaps out before its
 * lifecycle hooks fire (e.g. `{#key}` re-mount, conditional render).
 *
 * Usage (inside a component <script>):
 *
 *   useInterval(() => poll(), 5_000);
 *   useInterval(() => tick(), () => currentDelay);
 *
 * The delay can be either a constant `number` or a thunk read on every
 * `$effect` re-run — the effect re-subscribes whenever the dependencies
 * the thunk reads change, so the interval restarts at the new cadence.
 *
 * Pass `delay = 0` (or a thunk that returns 0) to stop the interval
 * without unmounting the caller; pass a positive number again to
 * resume.
 */
export function useInterval(fn: () => void, delay: number | (() => number)): void {
  $effect(() => {
    const ms = typeof delay === 'function' ? delay() : delay;
    if (!Number.isFinite(ms) || ms <= 0) return;
    const id = setInterval(fn, ms);
    return () => clearInterval(id);
  });
}
