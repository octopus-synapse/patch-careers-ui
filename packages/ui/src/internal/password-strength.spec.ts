import { describe, expect, it } from "vitest";
import { evaluatePasswordStrength, passwordScore, passwordSignals } from "./password-strength";

describe("passwordSignals", () => {
  it("detects each of the four signals independently", () => {
    expect(passwordSignals("Abcdefg1!")).toEqual({
      longEnough: true,
      mixedCase: true,
      hasDigit: true,
      hasSymbol: true,
    });
  });

  it("reports an all-false set for a short lowercase string", () => {
    expect(passwordSignals("abc")).toEqual({
      longEnough: false,
      mixedCase: false,
      hasDigit: false,
      hasSymbol: false,
    });
  });

  it("treats null-ish input as an empty password", () => {
    expect(passwordSignals(undefined as unknown as string)).toEqual({
      longEnough: false,
      mixedCase: false,
      hasDigit: false,
      hasSymbol: false,
    });
  });

  it("passwordScore counts the satisfied signals", () => {
    expect(passwordScore(passwordSignals("abcdefgh"))).toBe(1);
    expect(passwordScore(passwordSignals("Abcdefgh"))).toBe(2);
    expect(passwordScore(passwordSignals("Abcdefg1!"))).toBe(4);
  });
});

describe("evaluatePasswordStrength", () => {
  it("empty input scores 0 with all hints", () => {
    const r = evaluatePasswordStrength("");
    expect(r.score).toBe(0);
    expect(r.hints).toContain("min_length_8");
    expect(r.hints).toContain("mixed_case");
    expect(r.hints).toContain("add_digit");
    expect(r.hints).toContain("add_symbol");
  });

  it("only length passes for an 8-char lowercase string", () => {
    const r = evaluatePasswordStrength("abcdefgh");
    expect(r.score).toBe(1);
    expect(r.hints).toContain("mixed_case");
    expect(r.hints).toContain("add_digit");
    expect(r.hints).toContain("add_symbol");
  });

  it("max score 4 when all criteria met", () => {
    const r = evaluatePasswordStrength("Abcdefg1!");
    expect(r.score).toBe(4);
    expect(r.hints).toHaveLength(0);
  });

  it("counts mixed case as one signal", () => {
    const r = evaluatePasswordStrength("Abcdefgh");
    expect(r.score).toBe(2);
  });

  it("handles null-ish input gracefully", () => {
    const r = evaluatePasswordStrength(undefined as unknown as string);
    expect(r.score).toBe(0);
  });
});
