import { passwordSchema } from "@patch-careers/api-client";
import { describe, expect, it } from "vitest";
import { PASSWORD_POLICY, PASSWORD_RULES } from "./rules";
import { validatePassword } from "./validators";

// Drift guard: the numbers/symbols transcribed in rules.ts must agree with
// the generated SDK regex (which is derived from the backend swagger). If
// the backend changes its policy and the SDK is regenerated, this fails.
describe("PASSWORD_POLICY mirrors the generated passwordSchema", () => {
  const base = "Abcdef1"; // upper + lower + digit, 7 chars

  it("agrees on minLength", () => {
    const tooShort = `${base}!`.slice(0, PASSWORD_POLICY.minLength - 1);
    const justRight = `${base}!`.padEnd(PASSWORD_POLICY.minLength, "a");
    expect(passwordSchema.safeParse(tooShort).success).toBe(false);
    expect(passwordSchema.safeParse(justRight).success).toBe(true);
    expect(validatePassword(tooShort)?.code).toBe("STRING_TOO_SHORT");
    expect(validatePassword(justRight)).toBeNull();
  });

  it("agrees on maxLength", () => {
    const max = `${base}!`.padEnd(PASSWORD_POLICY.maxLength, "a");
    expect(passwordSchema.safeParse(max).success).toBe(true);
    expect(passwordSchema.safeParse(`${max}a`).success).toBe(false);
    expect(validatePassword(`${max}a`)?.code).toBe("STRING_TOO_LONG");
  });

  it("agrees on every accepted symbol", () => {
    for (const ch of PASSWORD_POLICY.specialChars) {
      const pw = `${base}${ch}`;
      expect(passwordSchema.safeParse(pw).success, `symbol ${ch}`).toBe(true);
      expect(validatePassword(pw), `symbol ${ch}`).toBeNull();
    }
  });

  it("rejects a symbol outside the policy on both sides (the old meter said OK to '#')", () => {
    const pw = `${base}#`;
    expect(passwordSchema.safeParse(pw).success).toBe(false);
    expect(validatePassword(pw)?.code).toBe("PASSWORD_NEEDS_SYMBOL");
  });

  it("reports each character-class rule with the backend's code", () => {
    expect(validatePassword("abcdefg1!")?.code).toBe("PASSWORD_NEEDS_UPPERCASE");
    expect(validatePassword("ABCDEFG1!")?.code).toBe("PASSWORD_NEEDS_LOWERCASE");
    expect(validatePassword("Abcdefgh!")?.code).toBe("PASSWORD_NEEDS_DIGIT");
    expect(validatePassword("Abcdefgh1")?.code).toBe("PASSWORD_NEEDS_SYMBOL");
    expect(PASSWORD_RULES.map((r) => r.code)).toEqual([
      "PASSWORD_NEEDS_UPPERCASE",
      "PASSWORD_NEEDS_LOWERCASE",
      "PASSWORD_NEEDS_DIGIT",
      "PASSWORD_NEEDS_SYMBOL",
    ]);
  });
});
