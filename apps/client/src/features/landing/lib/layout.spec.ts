import { describe, expect, it } from "vitest";
import { landingGrid } from "./layout";

describe("landingGrid", () => {
  // These are the numbers measured off the prototype at a 1600px window:
  // heading left edge 184, copy column 699 wide, mascot column starting 931.
  it("reproduces the prototype's grid at 1600px", () => {
    const grid = landingGrid(1600);
    expect(grid.container).toBe(1280);
    expect(Math.round(grid.gutter)).toBe(184);
    expect(Math.round(grid.copyWidth)).toBe(699);
    expect(Math.round(grid.stageWidth)).toBe(485);
    expect(Math.round(grid.stageLeft)).toBe(931);
  });

  it("stops growing past the container cap", () => {
    const wide = landingGrid(2400);
    expect(wide.container).toBe(1280);
    expect(Math.round(wide.copyWidth)).toBe(699);
    // The whole grid just centres further out.
    expect(Math.round(wide.gutter)).toBe(584);
  });

  it("shrinks with the window below the cap", () => {
    const narrow = landingGrid(1100);
    expect(narrow.container).toBe(1100);
    expect(narrow.gutter).toBe(24);
    expect(narrow.copyWidth).toBeLessThan(699);
    expect(narrow.copyWidth).toBeGreaterThan(0);
  });

  it("keeps the columns and the gap adding up to the content width", () => {
    const grid = landingGrid(1600);
    const content = grid.container - 24 * 2;
    expect(Math.round(grid.copyWidth + 48 + grid.stageWidth)).toBe(Math.round(content));
  });
});
