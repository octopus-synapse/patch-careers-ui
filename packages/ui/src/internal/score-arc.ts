/**
 * Shared geometry for the app's score arcs — the single place the SVG
 * ring math lives so `ScoreRing` (animated gauge) and `CompletenessRing`
 * (static arc around the avatar) can't drift. Pure: given a box size and
 * stroke width, returns the center, radius, and circumference of the
 * inscribed circle the arc is drawn on.
 */
export type ScoreArcGeometry = {
  center: number;
  r: number;
  circumference: number;
};

export function scoreArcGeometry(size: number, strokeWidth: number): ScoreArcGeometry {
  const r = (size - strokeWidth) / 2;
  return { center: size / 2, r, circumference: 2 * Math.PI * r };
}

/** strokeDashoffset for a given fill fraction (0..1) on a `circumference`. */
export function arcDashOffset(circumference: number, fraction: number): number {
  const clamped = Math.max(0, Math.min(1, fraction));
  return circumference * (1 - clamped);
}
