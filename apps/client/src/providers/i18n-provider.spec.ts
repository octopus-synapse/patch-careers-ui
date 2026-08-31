import { describe, expect, it } from "vitest";
import { localeFromLanguageTag } from "./i18n-provider";

describe("localeFromLanguageTag", () => {
  it("maps en variants to en", () => {
    expect(localeFromLanguageTag("en")).toBe("en");
    expect(localeFromLanguageTag("en-US")).toBe("en");
    expect(localeFromLanguageTag("EN-GB")).toBe("en");
  });

  it("keeps pt variants on pt-BR", () => {
    expect(localeFromLanguageTag("pt-BR")).toBe("pt-BR");
    expect(localeFromLanguageTag("pt-PT")).toBe("pt-BR");
  });

  it("falls back to pt-BR for unsupported or missing tags", () => {
    expect(localeFromLanguageTag("es-AR")).toBe("pt-BR");
    expect(localeFromLanguageTag("fr")).toBe("pt-BR");
    expect(localeFromLanguageTag(undefined)).toBe("pt-BR");
  });
});
