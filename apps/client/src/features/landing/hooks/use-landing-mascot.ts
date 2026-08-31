/**
 * `useLandingMascot` — the design system's mascot, driven by the chapters.
 *
 * The character, its breathing, blinking and gaze all come from
 * `useAuthMascot`; this hook only decides what he's doing on each chapter and
 * where he's looking. Two behaviours beyond the pose:
 *
 *  - he looks the way the deck is about to travel, a beat before the content
 *    arrives, which is what makes the move feel intentional rather than abrupt;
 *  - he follows the cursor when there is one, and rests when there isn't.
 */

import { useAuthMascot } from "@patch-careers/ui/editorial";
import { useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { CHAPTERS } from "../model/chapters";
import type { ChapterDirection, MascotPoseKey } from "../types";

export interface LandingMascot {
  readonly controller: ReturnType<typeof useAuthMascot>;
}

/** Every pose the landing uses, so switching one off switches the others off. */
const ALL_POSES: readonly MascotPoseKey[] = ["talk", "oops", "covered", "sealed", "happy", "snap"];

function poseFlags(pose: MascotPoseKey): Record<string, boolean> {
  return Object.fromEntries(ALL_POSES.map((key) => [key, key === pose]));
}

export function useLandingMascot(
  index: number,
  direction: ChapterDirection,
  /** While the scene runs, the director owns his poses and his gaze. */
  sceneActive = false,
): LandingMascot {
  const controller = useAuthMascot();
  const { pose, look } = controller;
  const gazeLocked = useRef(false);
  const sceneRef = useRef(sceneActive);
  sceneRef.current = sceneActive;

  // Arriving at a chapter is one moment, so it is one effect: he takes the
  // chapter's pose and glances the way we travelled, then settles back to
  // centre and hands the gaze back to the cursor.
  useEffect(() => {
    const chapter = CHAPTERS[index];
    if (!chapter || sceneRef.current) return;
    pose(poseFlags(chapter.pose));

    gazeLocked.current = true;
    look(0, direction === "down" ? 8 : -8);
    const release = setTimeout(() => {
      gazeLocked.current = false;
      look(0, 0);
    }, 700);
    return () => clearTimeout(release);
  }, [direction, index, look, pose]);

  // Follow the cursor, but never while a chapter change is being announced.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onMove = (event: MouseEvent): void => {
      if (gazeLocked.current || sceneRef.current) return;
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      look(Math.max(-1, Math.min(1, x)) * 10, Math.max(-1, Math.min(1, y)) * 8);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [look]);

  return useMemo(() => ({ controller }), [controller]);
}
