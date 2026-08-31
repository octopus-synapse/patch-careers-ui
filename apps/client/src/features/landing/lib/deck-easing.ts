/**
 * The deck's easing — a worklet, so Reanimated runs it on the UI thread.
 *
 * Deliberately NOT a cubic-bezier: the prototype's curve is piecewise — a hard
 * cubic ease-in for the first half, then a back-out that overshoots slightly
 * before settling. That "weight" at the end is what makes a chapter feel like
 * it lands rather than glides to a stop, and no single bezier expresses it.
 */

/** Overshoot strength for the back-out half. */
const BACK = 0.35;

export function deckEase(t: number): number {
  "worklet";
  if (t < 0.5) return 4 * t * t * t;
  const u = t - 1;
  return 1 + (BACK + 1) * u * u * u + BACK * u * u;
}

/** Chapter-to-chapter travel. */
export const DECK_DURATION_MS = 720;
/** Stepping inside a chapter that is taller than the viewport. */
export const STEP_DURATION_MS = 520;
/** How long the deck ignores further input after a move, so one gesture = one chapter. */
export const DECK_LOCK_MS = 220;
