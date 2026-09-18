import { revealBetween } from "./cinema-math";

export interface RevealLetter {
  readonly text: string;
  readonly index: number;
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Keep accents with their letters and reserve spaces without animating them. */
export function splitRevealLetters(text: string, offset = 0) {
  let index = offset;
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      Array.from(segmenter.segment(word), ({ segment }) => ({ text: segment, index: index++ })),
    );
  return { words, count: index - offset };
}

/** A continuous scroll interval per letter, with a small overlap at its edge. */
export function letterRevealProgress(progress: number, index: number, count: number): number {
  const step = 0.86 / Math.max(1, count);
  const start = index * step;
  return revealBetween(progress, start, Math.min(0.88, start + step * 1.25));
}
