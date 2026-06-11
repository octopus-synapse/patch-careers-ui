import { describe, expect, it } from "vitest";
import { editedAgo } from "./helpers";

const NOW = new Date("2026-06-11T12:00:00Z").getTime();

describe("editedAgo", () => {
  it("returns empty for missing or invalid dates", () => {
    expect(editedAgo(undefined, NOW)).toBe("");
    expect(editedAgo(null, NOW)).toBe("");
    expect(editedAgo("not-a-date", NOW)).toBe("");
  });

  it("scales agora → min → h → dias", () => {
    expect(editedAgo("2026-06-11T11:59:40Z", NOW)).toBe("agora");
    expect(editedAgo("2026-06-11T11:35:00Z", NOW)).toBe("há 25 min");
    expect(editedAgo("2026-06-11T07:00:00Z", NOW)).toBe("há 5 h");
    expect(editedAgo("2026-06-10T11:00:00Z", NOW)).toBe("há 1 dia");
    expect(editedAgo("2026-06-04T12:00:00Z", NOW)).toBe("há 7 dias");
  });

  it("falls back to an absolute date after ~a month", () => {
    expect(editedAgo("2026-04-01T12:00:00Z", NOW)).toMatch(/2026/);
  });
});
