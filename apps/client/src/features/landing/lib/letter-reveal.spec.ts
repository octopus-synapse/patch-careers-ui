import { describe, expect, it } from "vitest";
import { letterRevealProgress, splitRevealLetters } from "./letter-reveal";

describe("scroll-driven letters", () => {
  it("preserves combined accents and numbers letters continuously across lines", () => {
    const lead = splitRevealLetters("Voce\u0302 e\u0301");
    const rest = splitRevealLetters("muito mais.", lead.count);
    expect(lead.count).toBe(5);
    expect(lead.words[0]?.[3]?.text).toBe("e\u0302");
    expect(rest.words[0]?.[0]?.index).toBe(5);
    expect(rest.count).toBe(10);
  });

  it("reveals part of a word while keeping its later letters entirely hidden", () => {
    expect(letterRevealProgress(0.08, 0, 17)).toBe(1);
    expect(letterRevealProgress(0.08, 1, 17)).toBeGreaterThan(0);
    expect(letterRevealProgress(0.08, 1, 17)).toBeLessThan(1);
    expect(letterRevealProgress(0.08, 2, 17)).toBe(0);
    expect(letterRevealProgress(0.08, 16, 17)).toBe(0);
  });

  it("finishes before supporting copy appears and reverses every character", () => {
    for (const count of [1, 16, 17, 40]) {
      for (let index = 0; index < count; index += 1) {
        expect(letterRevealProgress(0.88, index, count)).toBe(1);
        expect(letterRevealProgress(0, index, count)).toBe(0);
      }
    }
  });
});
