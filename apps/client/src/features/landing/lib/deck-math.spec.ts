import { describe, expect, it } from "vitest";
import {
  bottomAlignedOffset,
  chapterAtOffset,
  clampOffset,
  isTall,
  stepInsideOffset,
  stripHeight,
  topOffset,
  topsFor,
} from "./deck-math";

const VIEWPORT = 800;
/** Three plain chapters, then one that is twice the viewport, then a plain one. */
const HEIGHTS = [800, 800, 800, 1600, 800];
const TOPS = topsFor(HEIGHTS);

describe("topsFor", () => {
  it("stacks chapters end to end", () => {
    expect(TOPS).toEqual([0, 800, 1600, 2400, 4000]);
  });

  it("is empty for no chapters", () => {
    expect(topsFor([])).toEqual([]);
  });
});

describe("stripHeight", () => {
  it("sums every chapter", () => {
    expect(stripHeight(HEIGHTS)).toBe(4800);
  });
});

describe("isTall", () => {
  it("is false for a chapter that fits the viewport", () => {
    expect(isTall(800, VIEWPORT)).toBe(false);
  });

  it("tolerates sub-pixel measurement noise", () => {
    expect(isTall(800.5, VIEWPORT)).toBe(false);
  });

  it("is true once the chapter outgrows the viewport", () => {
    expect(isTall(1600, VIEWPORT)).toBe(true);
  });
});

describe("topOffset", () => {
  it("lands a chapter's top at the top of the viewport", () => {
    expect(topOffset(TOPS, 2)).toBe(1600);
  });

  it("falls back to the deck start for an unknown index", () => {
    expect(topOffset(TOPS, 99)).toBe(0);
  });
});

describe("bottomAlignedOffset", () => {
  it("shows a tall chapter's end when arriving from below", () => {
    // chapter 3 spans 2400..4000; its last viewport starts at 3200
    expect(bottomAlignedOffset(TOPS, HEIGHTS, 3, VIEWPORT)).toBe(3200);
  });

  it("equals the top offset for a chapter that already fits", () => {
    expect(bottomAlignedOffset(TOPS, HEIGHTS, 1, VIEWPORT)).toBe(topOffset(TOPS, 1));
  });
});

describe("clampOffset", () => {
  it("never scrolls above the first chapter", () => {
    expect(clampOffset(-500, HEIGHTS, VIEWPORT)).toBe(0);
  });

  it("never scrolls past the last viewport of the deck", () => {
    expect(clampOffset(99_999, HEIGHTS, VIEWPORT)).toBe(4000);
  });

  it("leaves an in-range offset alone", () => {
    expect(clampOffset(1234, HEIGHTS, VIEWPORT)).toBe(1234);
  });
});

describe("stepInsideOffset", () => {
  it("returns null for a chapter that fits — the deck should change chapter", () => {
    expect(stepInsideOffset(800, TOPS, HEIGHTS, 1, VIEWPORT, 1)).toBeNull();
  });

  it("steps down inside a tall chapter", () => {
    expect(stepInsideOffset(2400, TOPS, HEIGHTS, 3, VIEWPORT, 1)).toBe(2960);
  });

  it("stops at the chapter's end instead of overshooting", () => {
    expect(stepInsideOffset(3000, TOPS, HEIGHTS, 3, VIEWPORT, 1)).toBe(3200);
  });

  it("returns null once the tall chapter is fully read — hand off to the deck", () => {
    expect(stepInsideOffset(3200, TOPS, HEIGHTS, 3, VIEWPORT, 1)).toBeNull();
  });

  it("steps back up inside a tall chapter", () => {
    expect(stepInsideOffset(3200, TOPS, HEIGHTS, 3, VIEWPORT, -1)).toBe(2640);
  });

  it("returns null at the tall chapter's top when travelling up", () => {
    expect(stepInsideOffset(2400, TOPS, HEIGHTS, 3, VIEWPORT, -1)).toBeNull();
  });
});

describe("chapterAtOffset", () => {
  it("reports the chapter filling the middle of the viewport", () => {
    expect(chapterAtOffset(0, TOPS, HEIGHTS, VIEWPORT)).toBe(0);
    expect(chapterAtOffset(800, TOPS, HEIGHTS, VIEWPORT)).toBe(1);
    expect(chapterAtOffset(4000, TOPS, HEIGHTS, VIEWPORT)).toBe(4);
  });

  it("still reports the tall chapter while scrolling through its middle", () => {
    expect(chapterAtOffset(3000, TOPS, HEIGHTS, VIEWPORT)).toBe(3);
  });

  it("clamps to the first chapter above the deck", () => {
    expect(chapterAtOffset(-200, TOPS, HEIGHTS, VIEWPORT)).toBe(0);
  });
});
