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

/** Test seam: returns current handler (or null if unset). */
export function _getHapticHandler(): HapticHandler | null {
  return handler;
}
