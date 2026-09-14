/**
 * `useSectionSpy` — "which section am I reading", for a single page whose rail
 * is a marker rather than a menu.
 *
 * The rule is the one the reference implementation settled on, and both halves
 * of it are load-bearing:
 *
 *   · the active section is the LAST one whose top has already crossed the
 *     reading line (the chrome's lower edge) — not the first one visible, so
 *     the rail names what you are reading rather than what is peeking in;
 *   · at the very bottom of the scroll the last section wins outright,
 *     otherwise a short final section can never light up at all — it never gets
 *     to push its own top past the line.
 *
 * Offsets come from `onLayout` on each section wrapper rather than from a DOM
 * query, so this works the same on native if the single page ever ships there.
 * They are content coordinates — measured inside the scroller, below whatever
 * top padding it already reserves for the floating chrome — so the reading line
 * is simply the scroll offset plus a little slack.
 * They are kept in a ref: they change on mount and on resize, never per frame,
 * and re-rendering the page on every measurement would fight the scroll.
 */

import { useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";

/** Slack below the reading line, so a heading lights its section as it arrives. */
const READING_LINE_SLACK = 24;

export type SectionSpy<Id extends string> = {
  readonly activeId: Id;
  readonly scrollRef: React.RefObject<ScrollView | null>;
  readonly onSectionLayout: (id: Id, y: number) => void;
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly scrollToSection: (id: Id, animated?: boolean) => void;
};

export function useSectionSpy<Id extends string>(ids: readonly Id[]): SectionSpy<Id> {
  const first = ids[0] as Id;
  const [activeId, setActiveId] = useState<Id>(first);
  const scrollRef = useRef<ScrollView | null>(null);
  const offsets = useRef<Partial<Record<Id, number>>>({});

  const onSectionLayout = useCallback((id: Id, y: number): void => {
    offsets.current[id] = y;
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;

      if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 4) {
        setActiveId(ids[ids.length - 1] as Id);
        return;
      }

      const line = contentOffset.y + READING_LINE_SLACK;
      let current = first;
      for (const id of ids) {
        const top = offsets.current[id];
        if (top !== undefined && top <= line) current = id;
      }
      setActiveId(current);
    },
    [ids, first],
  );

  const scrollToSection = useCallback((id: Id, animated = true): void => {
    const top = offsets.current[id];
    if (top === undefined) return;
    // Land the heading just under the chrome, not behind it.
    scrollRef.current?.scrollTo({ y: Math.max(0, top - READING_LINE_SLACK), animated });
    // Don't wait for the scroll event: on a short last section the spy may
    // never agree, and the rail must answer the click immediately either way.
    setActiveId(id);
  }, []);

  return { activeId, scrollRef, onSectionLayout, onScroll, scrollToSection };
}
