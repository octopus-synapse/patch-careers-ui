/**
 * `useChapterAddress` — keeps the URL hash and the tab title on the chapter.
 *
 * Deliberately NOT routed through expo-router: the chapter is not a route
 * segment, and `router.setParams` would fight the deck for control of the
 * address bar. `replaceState` keeps the back button meaning "leave the
 * landing", not "walk back one chapter".
 */

import { useEffect } from "react";
import { Platform } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { CHAPTERS } from "../model/chapters";

export function useChapterAddress(index: number): void {
  const { t } = useI18n();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const chapter = CHAPTERS[index];
    if (!chapter) return;

    const title = t(`landing.rail.${chapter.key}`);
    document.title = `${title} — Patch`;
    try {
      window.history.replaceState(null, "", `#${chapter.key}`);
    } catch {
      // Some embedded browsers reject replaceState; the deck works regardless.
    }
  }, [index, t]);
}

/** The chapter a first paint should land on, read from the URL hash. */
export function initialChapterIndex(): number {
  if (Platform.OS !== "web" || typeof window === "undefined") return 0;
  const hash = window.location.hash.replace(/^#/, "");
  const found = CHAPTERS.findIndex((chapter) => chapter.key === hash);
  return found >= 0 ? found : 0;
}
