/**
 * Deck geometry — pure functions, no React, no DOM.
 *
 * The deck is a strip of stacked chapters translated by a single offset. Every
 * chapter is at least a viewport tall; one that outgrows the viewport (the
 * demo-heavy ones) scrolls *inside itself* before the deck advances, which is
 * what `bottomAlignedOffset` and `stepInsideOffset` are for.
 *
 * Kept separate from the animation so the arithmetic is testable without a
 * renderer.
 */

/** Cumulative tops for a list of chapter heights. `tops[i]` is chapter i's y. */
export function topsFor(heights: readonly number[]): number[] {
  const tops: number[] = [];
  let running = 0;
  for (const height of heights) {
    tops.push(running);
    running += height;
  }
  return tops;
}

/** Total strip height. */
export function stripHeight(heights: readonly number[]): number {
  return heights.reduce((sum, height) => sum + height, 0);
}

/**
 * A chapter is "tall" when it can't be shown in one viewport. The 24px slack
 * keeps a chapter that overflows by a hair (font metrics, a wrapped line) from
 * demanding a phantom extra gesture to cross.
 */
export function isTall(height: number, viewport: number): boolean {
  return height > viewport + 24;
}

/**
 * Offset that puts a chapter's TOP at the top of the viewport — how you enter
 * a chapter travelling down.
 */
export function topOffset(tops: readonly number[], index: number): number {
  return tops[index] ?? 0;
}

/**
 * Offset that puts a chapter's BOTTOM at the bottom of the viewport — how you
 * enter a tall chapter travelling up, so you land on its end, not its start.
 */
export function bottomAlignedOffset(
  tops: readonly number[],
  heights: readonly number[],
  index: number,
  viewport: number,
): number {
  const top = tops[index] ?? 0;
  const height = heights[index] ?? viewport;
  return top + Math.max(0, height - viewport);
}

/** Clamp an offset to the deck's travel range. */
export function clampOffset(offset: number, heights: readonly number[], viewport: number): number {
  const max = Math.max(0, stripHeight(heights) - viewport);
  return Math.min(Math.max(offset, 0), max);
}

/**
 * Next offset when stepping *within* a tall chapter. Returns `null` when the
 * chapter is already at that edge, which is the deck's cue to change chapter.
 */
export function stepInsideOffset(
  current: number,
  tops: readonly number[],
  heights: readonly number[],
  index: number,
  viewport: number,
  direction: 1 | -1,
): number | null {
  const height = heights[index] ?? viewport;
  if (!isTall(height, viewport)) return null;

  const low = topOffset(tops, index);
  const high = bottomAlignedOffset(tops, heights, index, viewport);
  const stride = viewport * 0.7;

  if (direction > 0 && current < high - 1) return Math.min(high, current + stride);
  if (direction < 0 && current > low + 1) return Math.max(low, current - stride);
  return null;
}

/** The chapter occupying the middle of the viewport at a given offset. */
export function chapterAtOffset(
  offset: number,
  tops: readonly number[],
  heights: readonly number[],
  viewport: number,
): number {
  const probe = offset + viewport / 2;
  for (let index = heights.length - 1; index >= 0; index -= 1) {
    if (probe >= (tops[index] ?? 0)) return index;
  }
  return 0;
}
