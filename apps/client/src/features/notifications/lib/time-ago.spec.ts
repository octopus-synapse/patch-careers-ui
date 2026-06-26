import { createTranslator, ptBR } from "@patch-careers/i18n";
import { describe, expect, it } from "vitest";
import { timeAgo } from "./time-ago";

const NOW = new Date("2026-06-11T12:00:00Z").getTime();
const t = createTranslator(ptBR, "pt-BR");

describe("timeAgo", () => {
  it("returns empty for missing or invalid dates", () => {
    expect(timeAgo(undefined, NOW, t)).toBe("");
    expect(timeAgo(null, NOW, t)).toBe("");
    expect(timeAgo("not-a-date", NOW, t)).toBe("");
  });

  it("scales agora → m → h → d", () => {
    expect(timeAgo("2026-06-11T11:59:40Z", NOW, t)).toBe("agora");
    expect(timeAgo("2026-06-11T11:35:00Z", NOW, t)).toBe("25m");
    expect(timeAgo("2026-06-11T07:00:00Z", NOW, t)).toBe("5h");
    expect(timeAgo("2026-06-10T11:00:00Z", NOW, t)).toBe("1d");
    expect(timeAgo("2026-06-06T12:00:00Z", NOW, t)).toBe("5d");
  });

  it("falls back to an absolute date after a week", () => {
    expect(timeAgo("2026-04-01T12:00:00Z", NOW, t)).toMatch(/abr/);
  });
});
