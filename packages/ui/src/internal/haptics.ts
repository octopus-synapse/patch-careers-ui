/**
 * Haptic feedback abstraction.
 *
 * Defers the actual `expo-haptics` call to a setter so this package
 * stays import-safe in node tests (expo-haptics requires native module).
 * `apps/app` wires the real implementation at boot via `setHapticHandler`.
 */

export type HapticImpact = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export type HapticHandler = (impact: HapticImpact) => void;

let handler: HapticHandler | null = null;

export function setHapticHandler(next: HapticHandler | null): void {
  handler = next;
}

export function hapticImpact(impact: HapticImpact): void {
  handler?.(impact);
}

/**
 * Wraps a handler so it fires `impact` before delegating — the
 * "haptic then run" pattern (e.g. a destructive confirm's heavy impact).
 */
export function withHaptic<A extends unknown[]>(
  impact: HapticImpact,
  fn: (...args: A) => void,
): (...args: A) => void {
  return (...args: A) => {
    hapticImpact(impact);
    fn(...args);
  };
}

/** Test seam: returns current handler (or null if unset). */
export function _getHapticHandler(): HapticHandler | null {
  return handler;
}
