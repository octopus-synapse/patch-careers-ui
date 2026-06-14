import { editorialPalette, editorialPaletteDark } from "@patch-careers/tokens";
import { describe, expect, it } from "vitest";
import { passwordChecks, STRENGTH_LABEL, scorePassword, strengthColor } from "./editorial-password";

describe("scorePassword", () => {
  it("returns 0 for empty input", () => {
    expect(scorePassword("")).toBe(0);
  });

  it("floors passwords shorter than 6 chars to weak regardless of signals", () => {
    // has upper+lower+digit+symbol but only 5 chars → weak (1), never 0
    expect(scorePassword("Aa1$z")).toBe(1);
  });

  it("treats any non-empty password as at least weak", () => {
    expect(scorePassword("a")).toBe(1);
  });

  it("counts each independent signal", () => {
    expect(scorePassword("abcdefgh")).toBe(1); // length only
    expect(scorePassword("Abcdefgh")).toBe(2); // length + mixed case
    expect(scorePassword("Abcdefg1")).toBe(3); // + digit
    expect(scorePassword("Abcdefg1$")).toBe(4); // + symbol
  });

  it("caps at 4", () => {
    expect(scorePassword("Abcdefghijk1$%&")).toBe(4);
  });
});

describe("STRENGTH_LABEL / strengthColor", () => {
  it("maps every score to a label and a palette color in both themes", () => {
    for (const score of [0, 1, 2, 3, 4] as const) {
      expect(STRENGTH_LABEL[score]).toBeTypeOf("string");
      expect(strengthColor(editorialPalette, score)).toMatch(/^#[0-9a-f]{6}$/i);
      expect(strengthColor(editorialPaletteDark, score)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("uses the editorial ramp (danger→warn→fair→success)", () => {
    expect(strengthColor(editorialPalette, 1)).toBe(editorialPalette.danger);
    expect(strengthColor(editorialPalette, 2)).toBe(editorialPalette.warn);
    expect(strengthColor(editorialPalette, 3)).toBe(editorialPalette.fair);
    expect(strengthColor(editorialPalette, 4)).toBe(editorialPalette.success);
  });
});

describe("passwordChecks", () => {
  it("reports each requirement independently", () => {
    const checks = passwordChecks("Ab1$wxyz");
    expect(checks.map((c) => c.ok)).toEqual([true, true, true, true]);
  });

  it("flags missing requirements", () => {
    const checks = passwordChecks("abc");
    expect(checks.map((c) => c.ok)).toEqual([false, false, false, false]);
  });

  it("uses provided i18n hint labels", () => {
    const checks = passwordChecks("abc", {
      length: "8+",
      case: "aA",
      digit: "123",
      symbol: "#@",
    });
    expect(checks.map((c) => c.label)).toEqual(["8+", "aA", "123", "#@"]);
  });

  it("falls back to default labels", () => {
    const checks = passwordChecks("abc");
    expect(checks.map((c) => c.label)).toEqual(["8+ chars", "Aa", "0-9", "Symbol"]);
  });
});
