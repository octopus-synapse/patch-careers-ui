/** Gestures choose complete chapters; the scroll surface drives their continuous animation. */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { createScrollTimeline, readScrollTimeline, remapScroll } from "../lib/scroll-timeline";
import { useLandingSequence } from "../model/landing-variants";
import type { ChapterDirection } from "../types";
import type { ChapterDeck } from "./use-chapter-deck";

function arrival(scene: { start: number; hold: number } | undefined, viewport: number) {
  return scene ? scene.start + (scene.hold >= viewport * 0.65 ? 0 : scene.hold) : 0;
}

export function useChapterDeck(
  count: number,
  viewport: number,
  initialIndex = 0,
  reduced = false,
): ChapterDeck {
  const { chapters } = useLandingSequence();
  const { width } = useWindowDimensions();
  const [host, connect] = useState<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState(() => Array.from({ length: count }, () => viewport));
  const geometry = useMemo(
    () => measured.map((height) => Math.max(viewport, height)),
    [measured, viewport],
  );
  const timeline = useMemo(
    () =>
      createScrollTimeline(
        geometry,
        viewport,
        width < 1024,
        reduced,
        chapters.map((chapter) => (width < 1024 ? 0 : chapter.hold)),
      ),
    [geometry, viewport, width, reduced, chapters],
  );
  const previous = useRef(timeline);
  const initialized = useRef(false);
  const offset = useSharedValue(initialIndex * viewport);
  const position = useSharedValue(initialIndex);
  const focus = useSharedValue(initialIndex);
  const heights = useSharedValue(geometry);
  const [index, setIndex] = useState(initialIndex);
  const [settledIndex, setSettledIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<ChapterDirection>("down");
  const currentIndex = useRef(initialIndex);
  const currentSettled = useRef(initialIndex);
  const currentDirection = useRef<ChapterDirection>("down");
  const navigation = useRef<{ index: number; animated: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!host) return;
    const target = initialized.current
      ? remapScroll(host.scrollTop, previous.current, timeline)
      : arrival(timeline.scenes[initialIndex], viewport);
    initialized.current = true;
    previous.current = timeline;
    heights.value = [...timeline.heights];
    host.scrollTop = target;
    let visual = target;
    let destination = target;
    let frame = 0;
    let lastTime = 0;
    const paint = (scroll: number): void => {
      const sample = readScrollTimeline(scroll, timeline);
      const requested = navigation.current;
      if (requested && Math.abs(scroll - arrival(timeline.scenes[requested.index], viewport)) < 1) {
        navigation.current = null;
      }
      offset.value = sample.offset;
      position.value = sample.position;
      focus.value = sample.focus;
      if (sample.index !== currentIndex.current) {
        const nextDirection = sample.index > currentIndex.current ? "down" : "up";
        currentIndex.current = sample.index;
        setIndex(sample.index);
        if (nextDirection !== currentDirection.current) {
          currentDirection.current = nextDirection;
          setDirection(nextDirection);
        }
      }
      if (sample.settledIndex !== currentSettled.current) {
        currentSettled.current = sample.settledIndex;
        setSettledIndex(sample.settledIndex);
      }
    };
    const tick = (now: number): void => {
      frame = 0;
      const dt = lastTime ? Math.min(64, now - lastTime) : 16.67;
      lastTime = now;
      visual += (destination - visual) * (1 - Math.exp(-dt / 72));
      if (Math.abs(destination - visual) < 0.15) visual = destination;
      paint(visual);
      if (visual !== destination) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    };
    const onScroll = (): void => {
      destination = Math.max(0, Math.min(timeline.range, host.scrollTop));
      if (reduced) {
        visual = destination;
        paint(visual);
      } else if (!frame) frame = requestAnimationFrame(tick);
    };
    const onVisibility = (): void => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        visual = destination;
        paint(visual);
      }
    };
    paint(visual);
    const interruptNavigation = (): void => {
      navigation.current = null;
    };
    host.addEventListener("scroll", onScroll, { passive: true });
    host.addEventListener("pointerdown", interruptNavigation, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    // Measuring a newly mounted chapter cancels the browser's smooth scroll
    // above. Resume toward the requested chapter using its updated coordinates.
    const requested = navigation.current;
    if (requested) {
      host.scrollTo({
        top: arrival(timeline.scenes[requested.index], viewport),
        behavior: reduced || !requested.animated ? "instant" : "smooth",
      });
    }
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("scroll", onScroll);
      host.removeEventListener("pointerdown", interruptNavigation);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [focus, heights, host, initialIndex, offset, position, reduced, timeline, viewport]);

  const goTo = useCallback(
    (next: number, options?: { readonly animated?: boolean }) => {
      const bounded = Math.max(0, Math.min(count - 1, next));
      const scene = timeline.scenes[bounded];
      if (!host || !scene) return;
      navigation.current = { index: bounded, animated: options?.animated !== false };
      host.scrollTo({
        top: arrival(scene, viewport),
        behavior: reduced || options?.animated === false ? "instant" : "smooth",
      });
    },
    [count, host, reduced, timeline, viewport],
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      // Ignore the rest of a gesture while its destination is still settling.
      // This also prevents key repeat or a second notch from stranding a frame.
      if (!host || navigation.current) return;
      const at = readScrollTimeline(host.scrollTop, timeline).index;
      const scene = timeline.scenes[at];
      if (!scene) return;
      const contentStart = scene.start + scene.hold;
      if (
        scene.hold >= viewport * 0.65 &&
        ((delta > 0 && host.scrollTop < contentStart - 1) ||
          (delta < 0 && host.scrollTop <= contentStart + 1 && host.scrollTop > scene.start + 1))
      ) {
        host.scrollTo({
          top: Math.max(
            scene.start,
            Math.min(contentStart, host.scrollTop + (delta * scene.hold) / 3),
          ),
          behavior: reduced ? "instant" : "smooth",
        });
        return;
      }
      const contentEnd = contentStart + scene.overflow;
      if (
        scene.overflow > 24 &&
        ((delta > 0 && host.scrollTop < contentEnd - 1) ||
          (delta < 0 && host.scrollTop > contentStart + 1))
      ) {
        host.scrollTo({
          top: Math.max(
            contentStart,
            Math.min(contentEnd, host.scrollTop + delta * viewport * 0.7),
          ),
          behavior: reduced ? "instant" : "smooth",
        });
      } else goTo(at + delta);
    },
    [goTo, host, reduced, timeline, viewport],
  );

  const measure = useCallback((at: number, height: number) => {
    const next = Math.round(height);
    setMeasured((current) => {
      if (current[at] === next) return current;
      const copy = [...current];
      copy[at] = next;
      return copy;
    });
  }, []);

  return useMemo(
    () => ({
      index,
      settledIndex,
      direction,
      offset,
      heights,
      goTo,
      step,
      measure,
      count,
      scroll: { connect, range: timeline.range, position, focus },
    }),
    [
      index,
      settledIndex,
      direction,
      offset,
      heights,
      goTo,
      step,
      measure,
      count,
      timeline.range,
      position,
      focus,
    ],
  );
}
