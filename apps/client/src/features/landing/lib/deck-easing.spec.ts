import { describe, expect, it } from "vitest";
import { deckEase } from "./deck-easing";

describe("deck transition", () => {
  it("does not jump at the midpoint or overshoot the arriving chapter", () => {
    expect(deckEase(0.5)).toBe(0.5);
    expect(deckEase(0.5001) - deckEase(0.4999)).toBeLessThan(0.001);
    let previous = 0;
    for (let frame = 0; frame <= 240; frame += 1) {
      const position = deckEase(frame / 240);
      expect(position).toBeGreaterThanOrEqual(previous);
      expect(position).toBeLessThanOrEqual(1);
      expect(position - previous).toBeLessThan(0.008);
      previous = position;
    }
  });

  it("has zero speed at each endpoint and mirrors the reverse transition", () => {
    expect(deckEase(0)).toBe(0);
    expect(deckEase(1)).toBe(1);
    expect(deckEase(0.001)).toBeLessThan(0.000001);
    expect(1 - deckEase(0.999)).toBeLessThan(0.000001);
    for (const p of [0.1, 0.25, 0.4, 0.7, 0.9]) {
      expect(deckEase(p)).toBeCloseTo(1 - deckEase(1 - p), 12);
    }
  });
});
