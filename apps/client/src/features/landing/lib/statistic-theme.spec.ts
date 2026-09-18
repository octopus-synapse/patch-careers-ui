import { describe, expect, it } from "vitest";
import { statisticWipe } from "./statistic-theme";

const heights = Array.from({ length: 18 }, () => 800);
describe("statistic section scroll wipe", () => {
  it("covers all six chapters, then returns to light", () => {
    expect(statisticWipe(0, heights, 800).dark).toBe(false);
    for (const offset of [800, 1600, 2400, 3200, 4000, 4800]) {
      expect(statisticWipe(offset, heights, 800).dark).toBe(true);
    }
    expect(statisticWipe(5600, heights, 800).dark).toBe(false);
  });
  it("uses a bowed edge midway and retraces it on reverse scroll", () => {
    const entry = statisticWipe(400, heights, 800);
    expect(entry.path).toContain("V 50 Q 50 0 100 50");
    statisticWipe(800, heights, 800);
    expect(statisticWipe(400, heights, 800)).toEqual(entry);
    expect(statisticWipe(5200, heights, 800).path).toContain("V 50 Q 50 0 100 50");
  });
  it("respects measured chapter overflow and reduced motion", () => {
    const taller = [1200, ...heights.slice(1)];
    expect(statisticWipe(400, taller, 800).path).toBe(statisticWipe(0, heights, 800).path);
    expect(statisticWipe(400, heights, 800, true).path).not.toContain("V 50");
  });
});
