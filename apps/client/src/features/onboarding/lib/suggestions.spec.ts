import { describe, expect, it } from "vitest";
import type { SectionItem } from "../types";
import {
  isCurrentJob,
  suggestHeadlinesFromExperience,
  suggestUsernameFromName,
} from "./suggestions";

const job = (content: Record<string, unknown>): SectionItem => ({ content });

describe("suggestions", () => {
  it("suggests 'Role @ Company' plus the bare role from the current job", () => {
    const items = [job({ role: "Frontend Engineer", company: "Vercel", endDate: null })];
    expect(suggestHeadlinesFromExperience(items)).toEqual([
      "Frontend Engineer @ Vercel",
      "Frontend Engineer",
    ]);
  });

  it("leads with the current job (no end date) over past jobs, capped at 3", () => {
    const items = [
      job({ role: "Junior Dev", company: "OldCo", endDate: "2022-01-01" }),
      job({ role: "Senior Dev", company: "NewCo", endDate: "" }),
    ];
    expect(suggestHeadlinesFromExperience(items)).toEqual([
      "Senior Dev @ NewCo",
      "Senior Dev",
      "Junior Dev @ OldCo",
    ]);
  });

  it("deduplicates and falls back to role only when company is missing", () => {
    expect(suggestHeadlinesFromExperience([job({ jobTitle: "Designer" })])).toEqual(["Designer"]);
  });

  it("returns empty when there is nothing to suggest", () => {
    expect(suggestHeadlinesFromExperience([])).toEqual([]);
    expect(suggestHeadlinesFromExperience([job({})])).toEqual([]);
  });

  it("detects current job by empty/absent end date or explicit flag", () => {
    expect(isCurrentJob(job({ endDate: "" }))).toBe(true);
    expect(isCurrentJob(job({ endDate: null }))).toBe(true);
    expect(isCurrentJob(job({ current: true, endDate: "2020-01-01" }))).toBe(true);
    expect(isCurrentJob(job({ endDate: "2021-01-01" }))).toBe(false);
  });

  it("suggests a username handle from a name", () => {
    expect(suggestUsernameFromName("Maria Silva")).toBe("maria_silva");
    expect(suggestUsernameFromName("João D'Ávila")).toBe("joao_d_avila");
    expect(suggestUsernameFromName("  Al ")).toBe("");
    expect(suggestUsernameFromName("")).toBe("");
  });
});
