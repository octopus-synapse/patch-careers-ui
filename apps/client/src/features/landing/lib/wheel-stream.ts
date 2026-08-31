/**
 * Trackpad-safe wheel accumulation — a pure reducer, no DOM.
 *
 * A mouse wheel sends one big delta per notch; a trackpad sends a long tail of
 * small ones for a single flick. Treating every event as a step would rocket
 * through the deck. So deltas are accumulated into a "stream" (events closer
 * together than `STREAM_GAP_MS`), each stream fires at most once, and only
 * after the accumulated delta clears `THRESHOLD`.
 */

/** A pause longer than this starts a new gesture. */
const STREAM_GAP_MS = 140;
/** Accumulated delta needed before a stream counts as a step. */
const THRESHOLD = 40;

export interface WheelStream {
  /** Accumulated delta for the current stream. */
  readonly accumulated: number;
  /** Timestamp of the last event, to detect the gap that ends a stream. */
  readonly lastAt: number;
  /** Whether the current stream already produced a step. */
  readonly fired: boolean;
}

export const IDLE_WHEEL_STREAM: WheelStream = { accumulated: 0, lastAt: 0, fired: false };

export interface WheelStreamResult {
  readonly state: WheelStream;
  /** 1 = advance, -1 = go back, 0 = keep accumulating. */
  readonly step: 1 | -1 | 0;
}

export function reduceWheel(state: WheelStream, deltaY: number, now: number): WheelStreamResult {
  const isNewStream = now - state.lastAt > STREAM_GAP_MS;
  const accumulated = (isNewStream ? 0 : state.accumulated) + deltaY;
  const fired = isNewStream ? false : state.fired;

  if (fired || Math.abs(accumulated) < THRESHOLD) {
    return { state: { accumulated, lastAt: now, fired }, step: 0 };
  }

  return {
    state: { accumulated: 0, lastAt: now, fired: true },
    step: accumulated > 0 ? 1 : -1,
  };
}
