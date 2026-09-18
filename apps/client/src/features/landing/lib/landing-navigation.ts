import type { ChapterKey } from "../types";

export const LANDING_NAVIGATE_EVENT = "patch:landing-navigate";

export function navigateLandingChapter(chapter: ChapterKey): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LANDING_NAVIGATE_EVENT, { detail: chapter }));
}
