/**
 * `useDeckInput` — wheel, keyboard and hash, on web only.
 *
 * Every listener here is a raw DOM listener, which is deliberate: `wheel` must
 * be registered with `{ passive: false }` to be preventable (the page must not
 * scroll under the deck) and React Native has no prop for that. The whole body
 * is guarded by `Platform.OS === "web"`, so on native this hook does nothing —
 * and the file still compiles for React Native, which `expo export` checks.
 */

import { useEffect } from "react";
import { Platform } from "react-native";
import { IDLE_WHEEL_STREAM, reduceWheel, type WheelStream } from "../lib/wheel-stream";
import { CHAPTERS, chapterIndexOfHash } from "../model/chapters";

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
  readonly step: (direction: 1 | -1) => void;
  readonly goTo: (index: number) => void;
}

export function useDeckInput({ step, goTo }: DeckInputHandlers): void {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    let stream: WheelStream = IDLE_WHEEL_STREAM;

    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const result = reduceWheel(stream, event.deltaY, event.timeStamp);
      stream = result.state;
      if (result.step !== 0) step(result.step);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) return;
      const { key } = event;

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
        goTo(CHAPTERS.length - 1);
        return;
      }
      const digit = chapterFromDigit(key);
      if (digit !== null && digit < CHAPTERS.length) {
        event.preventDefault();
        goTo(digit);
      }
    };

    const onHashChange = (): void => {
      const target = chapterIndexOfHash(window.location.hash);
      if (target >= 0) goTo(target);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [goTo, step]);
}
