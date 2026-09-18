/**
 * `useChapterDeck` — the landing's single source of motion.
 *
 * One shared value (`offset`) translates the whole strip; everything else in
 * the page reads off it or off `index`. Chapters taller than the viewport step
 * inside themselves before the deck advances, so a long chapter is never
 * skipped past.
 *
 * A move finishes before the next one begins. One pending intent is retained,
 * so quick gestures cannot interrupt a reveal or build a long input backlog.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cancelAnimation,
  runOnJS,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DECK_DURATION_MS, deckEase, STEP_DURATION_MS } from "../lib/deck-easing";
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
  /** Web's native scroll surface; native platforms retain the chapter deck. */
  readonly scroll?: {
    readonly connect: (element: HTMLDivElement | null) => void;
    readonly range: number;
    readonly position: ReturnType<typeof useSharedValue<number>>;
    readonly focus: ReturnType<typeof useSharedValue<number>>;
  };
  /** Active chapter index. */
  readonly index: number;
  /** Kept alive through the outgoing chapter's last animation frame. */
  readonly settledIndex: number;
  /** Which way the last move travelled — drives the reveal's direction. */
  readonly direction: ChapterDirection;
  /** Strip translation, in px. Consumed by an `useAnimatedStyle`. */
  readonly offset: ReturnType<typeof useSharedValue<number>>;
  /** Measured geometry, also consumed on the animation thread. */
  readonly heights: ReturnType<typeof useSharedValue<number[]>>;
  /** Jump straight to a chapter (rail click, number key, deep link). */
  readonly goTo: (index: number, options?: { readonly animated?: boolean }) => void;
  /** One step of user intent: advance, or step inside a tall chapter first. */
  readonly step: (direction: 1 | -1) => void;
  /** Report a measured chapter height so the geometry stays honest. */
  readonly measure: (index: number, height: number) => void;
  readonly count: number;
}

export function useChapterDeck(
  count: number,
  viewport: number,
  initialIndex = 0,
  reduceMotion?: boolean,
): ChapterDeck {
  // Start ON the deep-linked chapter rather than jumping there after mount:
  // at first render every chapter still measures one viewport, so the offset
  // is exact, and the address hook never has a wrong hash to publish.
  const offset = useSharedValue(initialIndex * viewport);
  const [index, setIndex] = useState(initialIndex);
  const [settledIndex, setSettledIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<ChapterDirection>("down");
  const systemReduced = useReducedMotion();
  const reducedMotion = reduceMotion ?? systemReduced;
  const heights = useSharedValue(Array.from({ length: count }, () => viewport));

  // Heights start as "one viewport each" and are corrected by onLayout. Kept in
  // a ref (not state) so measurement doesn't re-render the whole deck; the
  // numbers are only ever read inside callbacks.
  const heightsRef = useRef<number[]>([]);
  if (heightsRef.current.length !== count) {
    heightsRef.current = Array.from({ length: count }, () => viewport);
  }
  const lockedRef = useRef(false);
  const indexRef = useRef(initialIndex);
  const pending = useRef<{ kind: "step" | "goTo"; value: number } | null>(null);
  const flush = useRef<() => void>(() => {});
  const targetRef = useRef(initialIndex * viewport);

  useEffect(
    () => () => {
      pending.current = null;
      cancelAnimation(offset);
    },
    [offset],
  );

  const complete = useCallback(() => {
    lockedRef.current = false;
    setSettledIndex(indexRef.current);
    flush.current();
  }, []);

  const animateTo = useCallback(
    (target: number, durationMs: number, animated: boolean) => {
      const heights = heightsRef.current;
      const clamped = clampOffset(target, heights, viewport);
      targetRef.current = clamped;
      if (animated && !reducedMotion) {
        offset.value = withTiming(
          clamped,
          { duration: durationMs, easing: deckEase },
          (finished) => {
            if (finished) runOnJS(complete)();
          },
        );
      } else {
        offset.value = clamped;
        complete();
      }
    },
    [complete, offset, reducedMotion, viewport],
  );

  const goTo = useCallback(
    (next: number, options?: { readonly animated?: boolean }) => {
      const bounded = Math.max(0, Math.min(count - 1, next));
      if (lockedRef.current) {
        pending.current = bounded === indexRef.current ? null : { kind: "goTo", value: bounded };
        return;
      }
      if (bounded === indexRef.current) return;

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
    },
    [animateTo, count, viewport],
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      if (lockedRef.current) {
        pending.current = { kind: "step", value: delta };
        return;
      }
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
        return;
      }
      goTo(indexRef.current + delta);
    },
    [animateTo, goTo, offset, viewport],
  );

  flush.current = () => {
    const intent = pending.current;
    pending.current = null;
    if (intent?.kind === "goTo") goTo(intent.value);
    else if (intent?.kind === "step") step(intent.value > 0 ? 1 : -1);
  };

  const measure = useCallback(
    (at: number, height: number) => {
      const measured = heightsRef.current;
      const next = Math.max(viewport, Math.round(height));
      if (measured[at] === next) return;
      const previousTop = topOffset(topsFor(measured), indexRef.current);
      const localTarget = targetRef.current - previousTop;
      measured[at] = next;
      heights.value = [...measured];
      // Keep the current chapter pinned while later chapters resize under it.
      if (at <= indexRef.current) {
        const nextTop = topOffset(topsFor(measured), indexRef.current);
        const local = lockedRef.current ? localTarget : offset.value - previousTop;
        const maxLocal = Math.max(0, (measured[indexRef.current] ?? viewport) - viewport);
        const target = nextTop + Math.max(0, Math.min(maxLocal, local));
        // Font loading and resizing can change the target during a move.
        // Retarget with a short settle; assigning offset directly would cancel
        // the completion callback and leave navigation locked forever.
        animateTo(target, 240, lockedRef.current);
      }
    },
    [animateTo, heights, offset, viewport],
  );

  return useMemo(
    () => ({ index, settledIndex, direction, offset, heights, goTo, step, measure, count }),
    [index, settledIndex, direction, offset, heights, goTo, step, measure, count],
  );
}
