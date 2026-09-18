import { describe, expect, it } from "vitest";
import { createScrollTimeline, readScrollTimeline, remapScroll } from "./scroll-timeline";

describe("native scroll timeline", () => {
  const timeline = createScrollTimeline([800, 1400, 800], 800, false, false, [1.5]);

  it("holds the visual scene while its choreography advances", () => {
    const first = readScrollTimeline(0, timeline);
    const middle = readScrollTimeline(600, timeline);
    expect(first.offset).toBe(0);
    expect(middle.offset).toBe(0);
    expect(middle.focus).toBe(0.5);
    expect(middle.position).toBeGreaterThan(first.position);
  });

  it("keeps every pixel of tall content readable before advancing", () => {
    const scene = timeline.scenes.at(1);
    expect(scene).toBeDefined();
    if (!scene) return;
    const start = scene.start + scene.hold;
    expect(readScrollTimeline(start, timeline).offset).toBe(800);
    expect(readScrollTimeline(start + 300, timeline).offset).toBe(1100);
    expect(readScrollTimeline(start + 600, timeline).offset).toBe(1400);
    expect(readScrollTimeline(start + 600, timeline).index).toBe(1);
  });

  it("has continuous chapter boundaries and reverses without state or overshoot", () => {
    for (const scene of timeline.scenes.slice(1)) {
      expect(
        Math.abs(readScrollTimeline(scene.start - 0.01, timeline).offset - scene.top),
      ).toBeLessThan(0.01);
      expect(readScrollTimeline(scene.start, timeline).offset).toBe(scene.top);
    }
    const positions = Array.from({ length: 101 }, (_, at) => (timeline.range * at) / 100);
    const forward = positions.map((scroll) => readScrollTimeline(scroll, timeline).offset);
    const reverse = [...positions]
      .reverse()
      .map((scroll) => readScrollTimeline(scroll, timeline).offset)
      .reverse();
    expect(reverse).toEqual(forward);
    for (let at = 1; at < forward.length; at++) {
      const previous = forward[at - 1];
      expect(previous).toBeDefined();
      if (previous !== undefined) expect(forward[at]).toBeGreaterThanOrEqual(previous);
    }
    expect(readScrollTimeline(-500, timeline).offset).toBe(0);
    expect(readScrollTimeline(100000, timeline).offset).toBe(2200);
  });

  it("preserves a reading position when an earlier chapter resizes", () => {
    const resized = createScrollTimeline([1100, 1400, 800], 800, false, false, [1.5]);
    const scene = timeline.scenes.at(1);
    expect(scene).toBeDefined();
    if (!scene) return;
    const scroll = scene.start + scene.hold + 250;
    const mapped = remapScroll(scroll, timeline, resized);
    expect(readScrollTimeline(mapped, resized).offset).toBe(1350);
    expect(readScrollTimeline(mapped, resized).index).toBe(1);
  });

  it("preserves the reveal beat across viewport changes", () => {
    const smaller = createScrollTimeline([600, 1400, 600], 600, true, false, [1.5]);
    expect(readScrollTimeline(remapScroll(600, timeline, smaller), smaller).focus).toBeCloseTo(0.5);
  });

  it("removes held animation distance for reduced motion", () => {
    const reduced = createScrollTimeline([800, 1400, 800], 800, false, true, [1.5, 2]);
    expect(reduced.range).toBe(2200);
    expect(reduced.scenes.every((scene) => scene.hold === 0)).toBe(true);
    const scene = reduced.scenes.at(1);
    expect(scene).toBeDefined();
    if (!scene) return;
    expect(readScrollTimeline(scene.start, reduced).focus).toBe(2);
  });
});
