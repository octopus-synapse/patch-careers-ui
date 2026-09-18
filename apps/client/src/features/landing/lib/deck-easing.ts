/**
 * The deck's easing — a worklet, so Reanimated runs it on the UI thread.
 *
 * Quintic smoothstep keeps position, velocity and acceleration continuous.
 * The old piecewise curve jumped from 0.5 to 0.91875 at its midpoint, skipping
 * almost half the transition in one frame. No overshoot also means a settled
 * chapter never briefly re-enters its outgoing opacity range.
 */

export function deckEase(t: number): number {
  "worklet";
  const p = Math.max(0, Math.min(1, t));
  return p * p * p * (p * (p * 6 - 15) + 10);
}

/** Enough time for the foreground, copy and scenery to separate and settle. */
export const DECK_DURATION_MS = 940;
/** Stepping inside a chapter that is taller than the viewport. */
export const STEP_DURATION_MS = 520;
