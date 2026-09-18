import { describe, expect, it } from "vitest";
import { EMPTY_JOBS_FILTERS } from "../types";
import {
  classifyJobInput,
  emptyEntry,
  matchesDiscoveryFilters,
  type Opportunity,
  readWorkspace,
  safeJobUrl,
  similarToSaved,
} from "./discovery";
import { discoveryParams, readDiscoveryRoute } from "./discovery-route";

const job: Opportunity = {
  id: "job-1",
  externalId: "external-1",
  title: "Frontend Engineer",
  company: "Acme",
  description: "Build accessible React interfaces",
  location: "São Paulo",
  isRemote: true,
  workMode: "REMOTE",
  employmentType: "FULL_TIME",
  applyUrl: "https://example.test/job",
  publisher: null,
  postedAt: null,
  fetchedAt: "2026-09-15T12:00:00Z",
  isSaved: false,
  savedId: null,
};
describe("job discovery", () => {
  it("distinguishes descriptions from valid links without navigating to unsafe schemes", () => {
    expect(classifyJobInput("https://example.test/role")).toBe("url");
    expect(classifyJobInput("www.example.test/role")).toBe("url");
    expect(classifyJobInput("https://")).toBe("invalid-url");
    expect(classifyJobInput("<script>alert(1)</script>".repeat(3))).toBe("description");
    expect(safeJobUrl("javascript:alert(1)")).toBeNull();
    expect(safeJobUrl("https://user:password@example.test")).toBeNull();
    expect(classifyJobInput("short")).toBe("short");
  });
  it("combines location, search, mode, contract and recency consistently", () => {
    const filters = {
      ...EMPTY_JOBS_FILTERS,
      search: "réact",
      location: "sao paulo",
      workModes: ["REMOTE" as const],
      postedWithin: "TODAY" as const,
    };
    expect(matchesDiscoveryFilters(job, filters, Date.parse("2026-09-15T14:00:00Z"))).toBe(true);
    expect(
      matchesDiscoveryFilters(
        { ...job, workMode: "HYBRID" },
        filters,
        Date.parse("2026-09-15T14:00:00Z"),
      ),
    ).toBe(false);
    expect(matchesDiscoveryFilters(job, filters, Date.parse("2026-09-17T14:00:00Z"))).toBe(false);
    expect(
      matchesDiscoveryFilters(
        job,
        { ...filters, employmentTypes: ["CONTRACT"] },
        Date.parse("2026-09-15T14:00:00Z"),
      ),
    ).toBe(false);
  });
  it("excludes saved identities even when the saved snapshot has a different route id", () => {
    const related = { ...job, id: "job-2", externalId: "external-2", title: "Frontend Developer" };
    const unrelated = { ...job, id: "job-3", externalId: "external-3", title: "Registered Nurse" };
    expect(similarToSaved([job, related, unrelated], [{ ...job, id: "saved-id" }])).toEqual([
      related,
    ]);
    expect(similarToSaved([job], [])).toEqual([]);
  });
  it("validates persisted entries and ignores other application preferences", () => {
    expect(
      readWorkspace({
        "jobs.v2.entry.job-1": emptyEntry(job),
        "jobs.v2.entry.corrupt": { version: 2 },
        unrelated: emptyEntry(job),
      }),
    ).toHaveLength(1);
    expect(
      readWorkspace({
        "jobs.v2.entry.bad": { ...emptyEntry(job), documents: [{ kind: "executable" }] },
      }),
    ).toEqual([]);
  });
  it("round trips filters and validates direct route parameters", () => {
    const filters = {
      ...EMPTY_JOBS_FILTERS,
      location: "São Paulo",
      search: "React",
      workModes: ["REMOTE" as const],
    };
    expect(readDiscoveryRoute(discoveryParams("all", "similar", filters))).toEqual({
      scope: "all",
      group: "similar",
      filters: { ...filters, postedWithin: null },
    });
    expect(
      readDiscoveryRoute({
        mode: "INVALID",
        period: "forever",
        scope: "unknown",
        group: "unknown",
      }),
    ).toMatchObject({ scope: "all", group: null, filters: { workModes: [], postedWithin: null } });
  });
});
