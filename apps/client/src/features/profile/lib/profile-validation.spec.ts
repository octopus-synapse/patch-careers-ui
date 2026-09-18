import type { Translator } from "@patch-careers/i18n";
import { describe, expect, it } from "vitest";
import {
  formatPhoneBR,
  isProfileFieldRequired,
  normalizeProfilePhone,
  profileFieldMaxLength,
  validateProfileField,
} from "./profile-validation";

// The validator returns a translated message; with an identity translator the
// returned string IS the i18n key, so we can assert which branch fired.
const t = ((key: string) => key) as unknown as Translator;

describe("isProfileFieldRequired", () => {
  it("only name is required", () => {
    expect(isProfileFieldRequired("name")).toBe(true);
    for (const k of ["headline", "bio", "location", "phone"] as const) {
      expect(isProfileFieldRequired(k)).toBe(false);
    }
  });
});

describe("validateProfileField", () => {
  it("flags a required empty name, accepts a valid one", () => {
    expect(validateProfileField("name", "   ", t)).toBe("validation.required");
    expect(validateProfileField("name", "A", t)).toBe("validation.minLength");
    expect(validateProfileField("name", "Ana Souza", t)).toBeNull();
  });

  it("treats empty optional fields as valid", () => {
    expect(validateProfileField("headline", "", t)).toBeNull();
    expect(validateProfileField("bio", "  ", t)).toBeNull();
    expect(validateProfileField("phone", "", t)).toBeNull();
  });

  it("enforces the headline max length", () => {
    expect(validateProfileField("headline", "x".repeat(120), t)).toBeNull();
    expect(validateProfileField("headline", "x".repeat(121), t)).toBe("validation.maxLength");
  });

  it("accepts BR landline/mobile phones and rejects junk", () => {
    expect(validateProfileField("phone", "(11) 99999-8888", t)).toBeNull();
    expect(validateProfileField("phone", "(11) 3333-4444", t)).toBeNull();
    expect(validateProfileField("phone", "+55 11 99999-8888", t)).toBeNull();
    expect(validateProfileField("phone", "12345", t)).toBe("validation.phoneInvalid");
  });
});

describe("formatPhoneBR", () => {
  it("masks a mobile number progressively", () => {
    expect(formatPhoneBR("11999998888")).toBe("(11) 99999-8888");
  });
  it("masks a landline number", () => {
    expect(formatPhoneBR("1133334444")).toBe("(11) 3333-4444");
  });
  it("keeps international input lenient", () => {
    expect(formatPhoneBR("+5511999998888")).toBe("+5511999998888");
  });
  it("returns empty for no digits", () => {
    expect(formatPhoneBR("")).toBe("");
  });
});

describe("profileFieldMaxLength", () => {
  it("exposes the contract limits", () => {
    expect(profileFieldMaxLength("name")).toBe(100);
    expect(profileFieldMaxLength("headline")).toBe(120);
    expect(profileFieldMaxLength("bio")).toBe(500);
  });
});

describe("normalizeProfilePhone", () => {
  it("preserves the DDD of legacy Brazilian numbers when opening the country picker", () => {
    expect(normalizeProfilePhone("(11) 99999-8888")).toBe("+5511999998888");
    expect(normalizeProfilePhone("2133334444")).toBe("+552133334444");
    expect(normalizeProfilePhone("55999998888")).toBe("+5555999998888");
  });

  it("keeps existing international dial codes and empty optional values", () => {
    expect(normalizeProfilePhone("+1 (415) 555-0132")).toBe("+14155550132");
    expect(normalizeProfilePhone("+351 912 345 678")).toBe("+351912345678");
    expect(normalizeProfilePhone("+55 11 99999-8888")).toBe("+5511999998888");
    expect(normalizeProfilePhone("  ")).toBe("");
  });
});
