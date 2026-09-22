import { describe, expect, it } from "vitest";
import { balancedPages } from "./balanced-pages";

describe("balancedPages", () => {
  it("holds orphaned items until another row can be displayed", () => {
    const items = Array.from({ length: 15 }, (_, index) => index + 1);
    expect(balancedPages(items, 12, true)).toEqual([items.slice(0, 12)]);
    expect(balancedPages([...items, 16], 12, true)).toEqual([items.slice(0, 12), [13, 14, 15, 16]]);
  });

  it("shows the remainder on the last page without creating a filler page", () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1);
    expect(balancedPages(items, 12, false)).toEqual([
      items.slice(0, 12),
      items.slice(12, 24),
      [25],
    ]);
    expect(balancedPages([1, 2, 3], 12, false)).toEqual([[1, 2, 3]]);
  });

  it("keeps a visited page stable when later batches arrive", () => {
    const firstBatch = Array.from({ length: 11 }, (_, index) => index + 1);
    expect(balancedPages(firstBatch, 12, true)).toEqual([firstBatch.slice(0, 8)]);
    const allItems = Array.from({ length: 16 }, (_, index) => index + 1);
    expect(balancedPages(allItems, 12, false, [8])).toEqual([
      allItems.slice(0, 8),
      allItems.slice(8),
    ]);
  });
});
