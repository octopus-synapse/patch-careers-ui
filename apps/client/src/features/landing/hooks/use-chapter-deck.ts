/**
 * `useChapterDeck` — the landing's single source of motion.
 *
 * One shared value (`offset`) translates the whole strip; everything else in
 * the page reads off it or off `index`. Chapters taller than the viewport step
 * inside themselves before the deck advances, so a long chapter is never
 * skipped past.
 *
 * The deck locks for `DECK_LOCK_MS` after each move: one gesture, one chapter.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { DECK_DURATION_MS, DECK_LOCK_MS, deckEase, STEP_DURATION_MS } from "../lib/deck-easing";
import {
  bottomAlignedOffset,
  clampOffset,
  isTall,
  stepInsideOffset,
  topOffset,
  topsFor,
} from "../lib/deck-math";
import type { ChapterDirection } from "../types";

export interface ChapterDeck {
  /** Active chapter index. */
  readonly index: number;
  /** Which way the last move travelled — drives the reveal's direction. */
  readonly direction: ChapterDirection;
  /** Strip translation, in px. Consumed by an `useAnimatedStyle`. */
  readonly offset: ReturnType<typeof useSharedValue<number>>;
  /** Jump straight to a chapter (rail click, number key, deep link). */
  readonly goTo: (index: number, options?: { readonly animated?: boolean }) => void;
  /** One step of user intent: advance, or step inside a tall chapter first. */
  readonly step: (direction: 1 | -1) => void;
  /** Report a measured chapter height so the geometry stays honest. */
  readonly measure: (index: number, height: number) => void;
  readonly count: number;
}

export function useChapterDeck(count: number, viewport: number, initialIndex = 0): ChapterDeck {
  // Start ON the deep-linked chapter rather than jumping there after mount:
  // at first render every chapter still measures one viewport, so the offset
  // is exact, and the address hook never has a wrong hash to publish.
  const offset = useSharedValue(initialIndex * viewport);
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<ChapterDirection>("down");
  const reducedMotion = useReducedMotion();

  // Heights start as "one viewport each" and are corrected by onLayout. Kept in
  // a ref (not state) so measurement doesn't re-render the whole deck; the
  // numbers are only ever read inside callbacks.
  const heightsRef = useRef<number[]>([]);
  if (heightsRef.current.length !== count) {
    heightsRef.current = Array.from({ length: count }, () => viewport);
  }
  const lockedRef = useRef(false);
  const indexRef = useRef(initialIndex);

  const unlockLater = useCallback(() => {
    setTimeout(() => {
      lockedRef.current = false;
    }, DECK_LOCK_MS);
  }, []);

  const animateTo = useCallback(
    (target: number, durationMs: number, animated: boolean) => {
      const heights = heightsRef.current;
      const clamped = clampOffset(target, heights, viewport);
      if (animated && !reducedMotion) {
        offset.value = withTiming(clamped, { duration: durationMs, easing: deckEase });
      } else {
        offset.value = clamped;
      }
    },
    [offset, reducedMotion, viewport],
  );

  const goTo = useCallback(
    (next: number, options?: { readonly animated?: boolean }) => {
      const bounded = Math.max(0, Math.min(count - 1, next));
      if (lockedRef.current || bounded === indexRef.current) return;

      const heights = heightsRef.current;
      const tops = topsFor(heights);
      const travellingUp = bounded < indexRef.current;
      // Arriving at a tall chapter from below lands on its END, so you read it
      // in the direction you're travelling rather than jumping to its top.
      const target =
        travellingUp && isTall(heights[bounded] ?? viewport, viewport)
          ? bottomAlignedOffset(tops, heights, bounded, viewport)
          : topOffset(tops, bounded);

      lockedRef.current = true;
      indexRef.current = bounded;
      setDirection(travellingUp ? "up" : "down");
      setIndex(bounded);
      animateTo(target, DECK_DURATION_MS, options?.animated ?? true);
      unlockLater();
    },
    [animateTo, count, unlockLater, viewport],
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      if (lockedRef.current) return;
      const heights = heightsRef.current;
      const tops = topsFor(heights);
      const inside = stepInsideOffset(
        offset.value,
        tops,
        heights,
        indexRef.current,
        viewport,
        delta,
      );
      if (inside !== null) {
        lockedRef.current = true;
        setDirection(delta > 0 ? "down" : "up");
        animateTo(inside, STEP_DURATION_MS, true);
        unlockLater();
        return;
      }
      goTo(indexRef.current + delta);
    },
    [animateTo, goTo, offset, unlockLater, viewport],
  );

  const measure = useCallback(
    (at: number, height: number) => {
      const heights = heightsRef.current;
      const next = Math.max(viewport, Math.round(height));
      if (heights[at] === next) return;
      heights[at] = next;
      // Keep the current chapter pinned while later chapters resize under it.
      if (at <= indexRef.current) {
        offset.value = clampOffset(
          topOffset(topsFor(heights), indexRef.current),
          heights,
          viewport,
        );
      }
    },
    [offset, viewport],
  );

  return useMemo(
    () => ({ index, direction, offset, goTo, step, measure, count }),
    [index, direction, offset, goTo, step, measure, count],
  );
}
