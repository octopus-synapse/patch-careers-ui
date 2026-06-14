import { createTranslator, ptBR } from "@patch-careers/i18n";
import { describe, expect, it } from "vitest";
import { editedAgo, resumeLanguageToLocale } from "./helpers";

const NOW = new Date("2026-06-11T12:00:00Z").getTime();
const t = createTranslator(ptBR, "pt-BR");

describe("editedAgo", () => {
  it("returns empty for missing or invalid dates", () => {
    expect(editedAgo(undefined, t, "pt-BR", NOW)).toBe("");
    expect(editedAgo(null, t, "pt-BR", NOW)).toBe("");
    expect(editedAgo("not-a-date", t, "pt-BR", NOW)).toBe("");
  });

  it("scales agora → min → h → dias", () => {
    expect(editedAgo("2026-06-11T11:59:40Z", t, "pt-BR", NOW)).toBe("agora");
    expect(editedAgo("2026-06-11T11:35:00Z", t, "pt-BR", NOW)).toBe("há 25 min");
    expect(editedAgo("2026-06-11T07:00:00Z", t, "pt-BR", NOW)).toBe("há 5 h");
    expect(editedAgo("2026-06-10T11:00:00Z", t, "pt-BR", NOW)).toBe("há 1 dia");
    expect(editedAgo("2026-06-04T12:00:00Z", t, "pt-BR", NOW)).toBe("há 7 dias");
  });

  it("falls back to an absolute date after ~a month", () => {
    expect(editedAgo("2026-04-01T12:00:00Z", t, "pt-BR", NOW)).toMatch(/2026/);
  });
});

describe("resumeLanguageToLocale", () => {
  it("maps pt-br (any case) to pt-BR", () => {
    expect(resumeLanguageToLocale("pt-br")).toBe("pt-BR");
    expect(resumeLanguageToLocale("pt-BR")).toBe("pt-BR");
    expect(resumeLanguageToLocale("pt")).toBe("pt-BR");
  });

  it("maps en variants to en", () => {
    expect(resumeLanguageToLocale("en")).toBe("en");
    expect(resumeLanguageToLocale("en-US")).toBe("en");
  });

  it("returns undefined for missing/unknown so the caller falls back to UI locale", () => {
    expect(resumeLanguageToLocale(undefined)).toBeUndefined();
    expect(resumeLanguageToLocale(null)).toBeUndefined();
    expect(resumeLanguageToLocale("fr")).toBeUndefined();
  });
});
