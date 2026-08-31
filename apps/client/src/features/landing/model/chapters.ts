/**
 * The 12 chapters, in page order — the landing's spine.
 *
 * Order here is the order on screen, the order of the rail, and the order the
 * number keys 1–9/0 jump to. The counters are numbers, never copy: the chapter
 * components format them per locale.
 */

import type { ChapterKey, ChapterSpec } from "../types";

export const CHAPTERS: readonly ChapterSpec[] = [
  { key: "hero", accent: "ink", pose: "talk" },
  { key: "dor", accent: "blush", pose: "oops", counter: { value: 7.4, fractionDigits: 1 } },
  { key: "robo", accent: "indigo", pose: "covered", counter: { value: 68, fractionDigits: 0 } },
  { key: "cena", accent: "indigo", pose: "talk" },
  { key: "vivo", accent: "mint", pose: "sealed" },
  { key: "vivo2", accent: "mint", pose: "sealed" },
  { key: "notas", accent: "ink", pose: "talk" },
  { key: "notas2", accent: "ink", pose: "talk" },
  { key: "auto", accent: "indigo", pose: "sealed" },
  { key: "auto2", accent: "indigo", pose: "sealed" },
  { key: "clique", accent: "indigo", pose: "snap" },
  { key: "cta", accent: "mint", pose: "happy" },
] as const;

/** Counters that live inside a sentence rather than as the chapter's big number. */
export const INLINE_COUNTERS = {
  /** "Cada vaga recebe **244 candidaturas**." */
  applicationsPerJob: 244,
  /** "Só na Gupy, **15 milhões** de candidaturas por mês…" */
  gupyMillions: 15,
  /** "…recebe **10,6× mais entrevistas**." */
  tailoredInterviews: 10.6,
} as const;

export function chapterIndexOf(key: ChapterKey): number {
  return CHAPTERS.findIndex((chapter) => chapter.key === key);
}

/** Resolve a URL hash (`#robo`) to a chapter index; -1 when it names nothing. */
export function chapterIndexOfHash(hash: string): number {
  const key = hash.replace(/^#/, "");
  return CHAPTERS.findIndex((chapter) => chapter.key === key);
}
