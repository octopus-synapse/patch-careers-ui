import { describe, expect, it } from "vitest";
import type { SectionItem } from "../types";
import { isCurrentJob, suggestHeadlineFromExperience } from "./suggestions";

const job = (content: Record<string, unknown>): SectionItem => ({ content });

describe("suggestions", () => {
  it("suggests 'Role @ Company' from the current job", () => {
    const items = [job({ role: "Frontend Engineer", company: "Vercel", endDate: null })];
    expect(suggestHeadlineFromExperience(items)).toBe("Frontend Engineer @ Vercel");
  });

  it("prefers the current job (no end date) over past jobs", () => {
    const items = [
      job({ role: "Junior Dev", company: "OldCo", endDate: "2022-01-01" }),
      job({ role: "Senior Dev", company: "NewCo", endDate: "" }),
    ];
    expect(suggestHeadlineFromExperience(items)).toBe("Senior Dev @ NewCo");
  });

  it("falls back to role only when company is missing", () => {
    expect(suggestHeadlineFromExperience([job({ jobTitle: "Designer" })])).toBe("Designer");
  });

  it("returns empty string when there is nothing to suggest", () => {
    expect(suggestHeadlineFromExperience([])).toBe("");
    expect(suggestHeadlineFromExperience([job({})])).toBe("");
  });

  it("detects current job by empty/absent end date or explicit flag", () => {
    expect(isCurrentJob(job({ endDate: "" }))).toBe(true);
    expect(isCurrentJob(job({ endDate: null }))).toBe(true);
    expect(isCurrentJob(job({ current: true, endDate: "2020-01-01" }))).toBe(true);
    expect(isCurrentJob(job({ endDate: "2021-01-01" }))).toBe(false);
  });
});
