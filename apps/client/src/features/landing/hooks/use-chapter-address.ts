import { useLandingSequence } from "../model/landing-variants";
/**
 * `useChapterAddress` — keeps the landing URL clean while chapters change.
 *
 * The chapter is deliberately NOT published to the address bar: the URL
 * stays `patchcareers.org` while the deck scrolls. The tab title remains the
 * fixed "Patch Careers" defined by `LandingHead`. An inbound `#robo` deep link
 * (old shared links) is still honoured on first paint via
 * `initialChapterIndex`, then stripped so the address ends up clean.
 *
 * Also deliberately NOT routed through expo-router: the chapter is not a
 * route segment, and `router.setParams` would fight the deck for control
 * of the address bar. `replaceState` keeps the back button meaning
 * "leave the landing", not "walk back one chapter".
 */

import { useEffect } from "react";
import { Platform } from "react-native";
import { CHAPTERS } from "../model/chapters";

export function useChapterAddress(index: number): void {
  const { chapters } = useLandingSequence();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const chapter = chapters[index];
    if (!chapter) return;

    if (!window.location.hash) return;
    try {
      // Expo Router may serialize a fragment before its query string.
      const fragmentQuery = window.location.hash.split("?")[1];
      const search = window.location.search || (fragmentQuery ? `?${fragmentQuery}` : "");
      window.history.replaceState(null, "", window.location.pathname + search);
    } catch {
      // Some embedded browsers reject replaceState; the deck works regardless.
    }
  }, [index, chapters]);
}

/** The chapter a first paint should land on, read from the URL hash. */
export function initialChapterIndex(chapters = CHAPTERS): number {
  if (Platform.OS !== "web" || typeof window === "undefined") return 0;
  const hash = window.location.hash.replace(/^#/, "").split("?")[0];
  const found = chapters.findIndex((chapter) => chapter.key === hash);
  return found >= 0 ? found : 0;
}
