import { landingScrollPalette } from "@patch-careers/tokens";
import { CHAPTERS } from "../model/chapters";

export const STATISTIC_GREEN = landingScrollPalette.statisticGreen;
export const STATISTIC_PAPER = landingScrollPalette.statisticPaper;
export const STATISTIC_LIME = landingScrollPalette.statisticLime;
export const isStatisticChapter = (key: string | undefined): boolean =>
  key === "dor" ||
  key === "interviews" ||
  key === "silence" ||
  key === "robo" ||
  key === "filter" ||
  key === "qualified";

/** The same two quadratic-curve poses as the reference, sampled from scroll. */
export function statisticWipe(
  offset: number,
  heights: readonly number[],
  viewport: number,
  reduced = false,
  chapters = CHAPTERS,
) {
  const top = (index: number) => heights.slice(0, index).reduce((sum, h) => sum + h, 0);
  let first = -1;
  let end = 0;
  for (let at = 0; at < chapters.length; at++) {
    if (!isStatisticChapter(chapters[at]?.key)) continue;
    const start = at;
    while (isStatisticChapter(chapters[at]?.key)) at++;
    if (offset >= top(start) - viewport && offset <= top(at)) {
      first = start;
      end = at;
      break;
    }
  }
  if (first < 0) return { path: "M 0 0 H 100 V 0 Z", dark: false };
  const entering = offset < top(first);
  const boundary = top(entering ? first : end);
  const progress = Math.max(0, Math.min(1, (offset - boundary + viewport) / viewport));
  const p = reduced ? (progress >= 0.5 ? 1 : 0) : progress;
  const phase = p < 0.5 ? (p * 2) ** 3 : 1 - (1 - (p - 0.5) * 2) ** 3;
  const edge = p < 0.5 ? 100 - 50 * phase : 50 * (1 - phase);
  const control = p < 0.5 ? 100 * (1 - phase) : 0;
  const origin = entering ? 100 : 0;
  return {
    path: `M 0 ${origin} V ${edge} Q 50 ${control} 100 ${edge} V ${origin} Z`,
    dark: entering ? edge < 8 : edge > 8,
  };
}
