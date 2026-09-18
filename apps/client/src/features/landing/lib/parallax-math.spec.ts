import { describe, expect, it } from "vitest";
import { chapterPosition, chapterTravel } from "./parallax-math";

describe("parallax geometry", () => {
  const heights = [800, 1400, 800];

  it("keeps a tall chapter readable from its top through its bottom", () => {
    for (const offset of [800, 1000, 1200, 1400]) {
      expect(chapterTravel(offset, heights, 1, 800)).toBe(0);
    }
    expect(chapterTravel(400, heights, 1, 800)).toBe(-0.5);
    expect(chapterTravel(1800, heights, 1, 800)).toBe(0.5);
  });

  it("aligns later chapters using measured heights, including after a resize", () => {
    expect(chapterTravel(2200, heights, 2, 800)).toBe(0);
    expect(chapterTravel(1800, [600, 1200, 600], 2, 600)).toBe(0);
  });

  it("bounds distant planes and handles a zero viewport", () => {
    expect(chapterTravel(-10000, heights, 2, 800)).toBe(-1.25);
    expect(chapterTravel(10000, heights, 0, 800)).toBe(1.25);
    expect(Number.isFinite(chapterTravel(100, [0], 0, 0))).toBe(true);
  });

  it("gives the background continuous positions through unequal chapters", () => {
    expect(chapterPosition(0, heights)).toBe(0);
    expect(chapterPosition(400, heights)).toBe(0.5);
    expect(chapterPosition(800, heights)).toBe(1);
    expect(chapterPosition(1500, heights)).toBe(1.5);
    expect(chapterPosition(2200, heights)).toBe(2);
    expect(chapterPosition(-20, heights)).toBe(0);
    expect(chapterPosition(9000, heights)).toBe(2);
  });
});
