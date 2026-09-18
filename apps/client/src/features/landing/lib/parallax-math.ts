/** Geometry shared by the content planes and the continuous background. */
export function chapterTravel(
  offset: number,
  heights: readonly number[],
  index: number,
  viewport: number,
): number {
  "worklet";
  const unit = Math.max(1, viewport);
  let top = 0;
  for (let at = 0; at < index; at += 1) top += heights[at] ?? unit;
  const bottom = top + Math.max(0, (heights[index] ?? unit) - unit);
  // A tall chapter remains fully readable throughout its internal scroll.
  const distance = offset < top ? offset - top : offset > bottom ? offset - bottom : 0;
  return Math.max(-1.25, Math.min(1.25, distance / unit));
}

export function chapterPosition(offset: number, heights: readonly number[]): number {
  "worklet";
  let top = 0;
  for (let at = 0; at < heights.length; at += 1) {
    const height = Math.max(1, heights[at] ?? 1);
    if (offset < top + height) {
      return Math.max(0, Math.min(heights.length - 1, at + (offset - top) / height));
    }
    top += height;
  }
  return Math.max(0, heights.length - 1);
}
