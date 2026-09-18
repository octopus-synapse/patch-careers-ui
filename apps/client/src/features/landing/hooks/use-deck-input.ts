import { useLandingSequence } from "../model/landing-variants";
/**
 * `useDeckInput` — wheel and keyboard, on web only.
 *
 * Every listener here is a raw DOM listener, which is deliberate: `wheel` must
 * be registered with `{ passive: false }` to be preventable (the page must not
 * scroll under the deck) and React Native has no prop for that. The whole body
 * is guarded by `Platform.OS === "web"`, so on native this hook does nothing —
 * and the file still compiles for React Native, which `expo export` checks.
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { LANDING_NAVIGATE_EVENT } from "../lib/landing-navigation";
import { isOverlayOpen } from "../lib/landing-overlay";
import { IDLE_WHEEL_STREAM, reduceWheel, type WheelStream } from "../lib/wheel-stream";

/** Number keys map 1–9 to chapters 1–9 and 0 to the tenth. */
function chapterFromDigit(key: string): number | null {
  if (!/^[0-9]$/.test(key)) return null;
  return key === "0" ? 9 : Number(key) - 1;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!element?.tagName) return false;
  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.isContentEditable === true
  );
}

export interface DeckInputHandlers {
  readonly nativeScroll?: boolean;
  readonly step: (direction: 1 | -1) => void;
  readonly goTo: (index: number) => void;
}

export function useDeckInput({ step, goTo, nativeScroll = false }: DeckInputHandlers): void {
  const { chapters } = useLandingSequence();
  const wheelStream = useRef<WheelStream>(IDLE_WHEEL_STREAM);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    let touch: { x: number; y: number } | null = null;

    // While an overlay is mounted the deck is inert: the wheel must reach the
    // overlay's own scroll areas (the terms ScrollView!) and keys must not
    // step chapters behind the scrim.
    const onWheel = (event: WheelEvent): void => {
      if (nativeScroll) return;
      if (isOverlayOpen() || event.ctrlKey || isTypingTarget(event.target)) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      // deltaMode is pixels (0), lines (1), or pages (2). Its magnitude
      // never determines the distance travelled: one intent = one chapter.
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      const result = reduceWheel(wheelStream.current, event.deltaY * unit, event.timeStamp);
      wheelStream.current = result.state;
      if (result.step !== 0) step(result.step);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        isOverlayOpen() ||
        isTypingTarget(event.target) ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (event.repeat) return;
      const { key } = event;
      if (
        key === " " &&
        event.target instanceof Element &&
        event.target.closest("button, a, [role=button], [role=link]")
      )
        return;

      if (key === "ArrowDown" || key === "PageDown" || key === " ") {
        event.preventDefault();
        step(1);
        return;
      }
      if (key === "ArrowUp" || key === "PageUp") {
        event.preventDefault();
        step(-1);
        return;
      }
      if (key === "Home") {
        event.preventDefault();
        goTo(0);
        return;
      }
      if (key === "End") {
        event.preventDefault();
        goTo(chapters.length - 1);
        return;
      }
      const digit = chapterFromDigit(key);
      if (digit !== null && digit < chapters.length) {
        event.preventDefault();
        goTo(digit);
      }
    };

    const onTouchStart = (event: TouchEvent): void => {
      touch = null;
      if (nativeScroll) return;
      if (isOverlayOpen() || event.touches.length !== 1) return;
      if (
        event.target instanceof Element &&
        event.target.closest("input, textarea, select, button, a, [role=button], [role=link]")
      )
        return;
      const point = event.touches[0];
      if (point) touch = { x: point.clientX, y: point.clientY };
    };
    const onTouchMove = (event: TouchEvent): void => {
      if (event.touches.length !== 1 || isOverlayOpen()) {
        touch = null;
        return;
      }
      const point = event.touches[0];
      if (!touch || !point) return;
      const dy = point.clientY - touch.y;
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(point.clientX - touch.x))
        event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent): void => {
      const start = touch;
      touch = null;
      const point = event.changedTouches[0];
      if (!start || !point || isOverlayOpen()) return;
      const dy = start.y - point.clientY;
      if (Math.abs(dy) >= 48 && Math.abs(dy) > Math.abs(start.x - point.clientX))
        step(dy > 0 ? 1 : -1);
    };
    const onTouchCancel = (): void => {
      touch = null;
    };

    const onNavigate = (event: Event): void => {
      if (isOverlayOpen()) return;
      const index = chapters.findIndex((chapter) => chapter.key === (event as CustomEvent).detail);
      if (index >= 0) goTo(index);
    };
    window.addEventListener(LANDING_NAVIGATE_EVENT, onNavigate);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener(LANDING_NAVIGATE_EVENT, onNavigate);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [goTo, step, nativeScroll, chapters]);
}
