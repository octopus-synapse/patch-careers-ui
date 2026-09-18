/**
 * The chapters, in page order — the landing's spine.
 *
 * Order here is the order on screen, the order of the rail, and the order the
 * number keys 1–9/0 jump to. The counters are numbers, never copy: the chapter
 * components format them per locale.
 */

import type { ChapterKey, ChapterSpec } from "../types";

export const CHAPTERS: readonly ChapterSpec[] = [
  { key: "hero", accent: "ink", pose: "talk" },
  { key: "dor", accent: "mint", pose: "oops", counter: { value: 7.4, fractionDigits: 1 } },
  { key: "interviews", accent: "mint", pose: "oops" },
  { key: "silence", accent: "mint", pose: "oops" },
  { key: "robo", accent: "mint", pose: "covered" },
  { key: "filter", accent: "mint", pose: "covered" },
  { key: "qualified", accent: "mint", pose: "oops" },
  { key: "vivo", accent: "mint", pose: "sealed" },
  { key: "versions", accent: "mint", pose: "sealed" },
  { key: "notas", accent: "ink", pose: "talk" },
  { key: "auto", accent: "indigo", pose: "sealed" },
  { key: "cta", accent: "mint", pose: "happy" },
] as const;

/** Counters that live inside a sentence rather than as the chapter's big number. */
export const INLINE_COUNTERS = {
  /** "Cada vaga recebe **244 candidaturas**." */
  applicationsPerJob: 244,
  /** "…recebe **10,6× mais entrevistas**." */
  tailoredInterviews: 10.6,
} as const;

export function chapterIndexOf(key: ChapterKey): number {
  return CHAPTERS.findIndex((chapter) => chapter.key === key);
}
