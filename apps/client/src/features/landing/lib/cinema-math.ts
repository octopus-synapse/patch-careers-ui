import { deckEase } from "./deck-easing";

/** An interval on the scroll timeline, not a wall-clock animation. */
export function revealBetween(progress: number, start: number, end: number): number {
  "worklet";
  return deckEase((progress - start) / Math.max(0.001, end - start));
}

/** Supporting details follow the completed headline. */
export function manifestoBeats(progress: number) {
  return {
    rule: revealBetween(progress, 0.88, 0.98),
    caption: revealBetween(progress, 0.9, 1),
  };
}

/** First abstract silhouettes, then recognition, then the copy. */
export function connectionBeats(progress: number) {
  "worklet";
  const approach = revealBetween(progress, 0.08, 0.78);
  return {
    approach,
    lead: revealBetween(progress, 0.76, 0.88),
    emphasis: revealBetween(progress, 0.86, 0.97),
    caption: revealBetween(progress, 0.92, 1),
    ripple: revealBetween(progress, 0.76, 1),
  };
}
