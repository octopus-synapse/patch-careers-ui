import { describe, expect, it } from "vitest";
import { LANDING_VARIANTS } from "../model/landing-variants";
import { isStatisticChapter, statisticWipe } from "./statistic-theme";

describe("comparison variants", () => {
  for (const variant of ["b"] as const) {
    const chapters = LANDING_VARIANTS[variant];
    it(`${variant} retains unique navigation and correctly themes every evidence boundary`, () => {
      expect(new Set(chapters.map((c) => c.key)).size).toBe(chapters.length);
      expect(chapters.filter((c) => isStatisticChapter(c.key))).toHaveLength(5);
      const heights = chapters.map(() => 900);
      chapters.forEach((chapter, index) => {
        expect(statisticWipe(index * 900, heights, 900, false, chapters).dark).toBe(
          isStatisticChapter(chapter.key),
        );
      });
      expect(chapters.some((c) => c.key === "cena")).toBe(false);
      expect(chapters.some((c) => ["versions", "vivo2", "filter"].includes(c.key))).toBe(false);
      expect(chapters[0]?.hold).toBeLessThan(0.65);
    });
  }
});
