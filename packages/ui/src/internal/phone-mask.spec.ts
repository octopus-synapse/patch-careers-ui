import { describe, expect, it } from "vitest";
import {
  DEFAULT_PHONE_COUNTRY,
  findCountryByIso,
  formatPhoneDisplay,
  PHONE_COUNTRIES,
  parseCanonicalPhone,
  toCanonicalPhone,
} from "./phone-mask";

const BR = findCountryByIso("BR") ?? DEFAULT_PHONE_COUNTRY;
const US = findCountryByIso("US") ?? DEFAULT_PHONE_COUNTRY;

describe("phone-mask", () => {
  it("formats a Brazilian mobile exactly as specified", () => {
    expect(formatPhoneDisplay(BR, "11978833101")).toBe("+55 (11) 97883-3101");
  });

  it("formats progressively as the user types (BR)", () => {
    expect(formatPhoneDisplay(BR, "11")).toBe("+55 (11)");
    expect(formatPhoneDisplay(BR, "1197")).toBe("+55 (11) 97");
    expect(formatPhoneDisplay(BR, "1197883")).toBe("+55 (11) 97883");
  });

  it("formats a Brazilian landline (8-digit national)", () => {
    expect(formatPhoneDisplay(BR, "1132654321")).toBe("+55 (11) 3265-4321");
  });

  it("formats a US/NANP number", () => {
    expect(formatPhoneDisplay(US, "4155550132")).toBe("+1 (415) 555-0132");
  });

  it("falls back to generic 3-3-4 grouping for countries without a mask", () => {
    const pt = findCountryByIso("PT") ?? DEFAULT_PHONE_COUNTRY;
    expect(formatPhoneDisplay(pt, "912345678")).toBe("+351 912 345 678");
  });

  it("shows just the dial code when empty", () => {
    expect(formatPhoneDisplay(BR, "")).toBe("+55");
  });

  it("strips non-digits before formatting", () => {
    expect(formatPhoneDisplay(BR, "(11) 97883-3101")).toBe("+55 (11) 97883-3101");
  });

  it("builds the canonical stored value", () => {
    expect(toCanonicalPhone(BR, "11978833101")).toBe("+5511978833101");
    expect(toCanonicalPhone(BR, "")).toBe("");
  });

  it("round-trips: parse(canonical) recovers country + national", () => {
    const canonical = toCanonicalPhone(BR, "11978833101");
    const parsed = parseCanonicalPhone(canonical);
    expect(parsed.country.iso).toBe("BR");
    expect(parsed.national).toBe("11978833101");
    expect(formatPhoneDisplay(parsed.country, parsed.national)).toBe("+55 (11) 97883-3101");
  });

  it("parses by longest dial-code prefix", () => {
    // +351 (Portugal) must win over +35x partials.
    const pt = findCountryByIso("PT") ?? DEFAULT_PHONE_COUNTRY;
    const canonical = toCanonicalPhone(pt, "912345678");
    expect(parseCanonicalPhone(canonical).country.iso).toBe("PT");
  });

  it("falls back to the default country for empty/unknown input", () => {
    expect(parseCanonicalPhone(undefined).country.iso).toBe(DEFAULT_PHONE_COUNTRY.iso);
    expect(parseCanonicalPhone(undefined).national).toBe("");
  });

  it("every country has a non-empty dial code and flag", () => {
    for (const c of PHONE_COUNTRIES) {
      expect(c.dialCode.length).toBeGreaterThan(0);
      expect(c.flag.length).toBeGreaterThan(0);
    }
  });
});
