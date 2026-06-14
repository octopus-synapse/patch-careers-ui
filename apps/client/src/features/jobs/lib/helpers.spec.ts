import { JobType, RemotePolicy } from "@patch-careers/api-client";
import { createTranslator, ptBR } from "@patch-careers/i18n";
import { describe, expect, it } from "vitest";
import { EMPTY_JOBS_FILTERS, type ExternalJob, type JobsFilters } from "../types";
import {
  activeFilterChips,
  groupJobsByPeriod,
  hasActiveFilters,
  jobMetaLine,
  postedAgo,
  setSavedFlag,
} from "./helpers";

const DAY_MS = 86_400_000;
const NOW = new Date("2026-06-11T12:00:00Z").getTime();

// Real pt-BR translator: proves the migrated keys render the exact copy
// these helpers hardcoded before the i18n move.
const t = createTranslator(ptBR, "pt-BR");

function buildJob(overrides: Partial<ExternalJob> = {}): ExternalJob {
  return {
    id: "job-1",
    externalId: "ext-1",
    title: "Dev Backend",
    company: "Acme",
    location: null,
    isRemote: false,
    workMode: RemotePolicy.ONSITE,
    employmentType: null,
    applyUrl: "https://example.com",
    publisher: null,
    description: null,
    postedAt: null,
    fetchedAt: new Date(NOW).toISOString(),
    isSaved: false,
    savedId: null,
    ...overrides,
  };
}

describe("postedAgo", () => {
  it("uses postedAt when present", () => {
    const job = {
      postedAt: new Date(NOW - 3 * DAY_MS).toISOString(),
      fetchedAt: new Date(NOW).toISOString(),
    };
    expect(postedAgo(job, NOW, t, "pt-BR")).toBe("há 3 dias");
  });

  it("falls back to fetchedAt when postedAt is null", () => {
    const job = { postedAt: null, fetchedAt: new Date(NOW - DAY_MS).toISOString() };
    expect(postedAgo(job, NOW, t, "pt-BR")).toBe("ontem");
  });

  it("labels same-day listings as hoje", () => {
    const job = { postedAt: null, fetchedAt: new Date(NOW - 60_000).toISOString() };
    expect(postedAgo(job, NOW, t, "pt-BR")).toBe("hoje");
  });

  it("returns empty string for malformed dates", () => {
    expect(postedAgo({ postedAt: "not-a-date", fetchedAt: "also-bad" }, NOW, t, "pt-BR")).toBe("");
  });
});

describe("jobMetaLine", () => {
  it("joins work mode, type and location with dots", () => {
    const line = jobMetaLine(
      {
        workMode: RemotePolicy.REMOTE,
        isRemote: true,
        employmentType: JobType.FULL_TIME,
        location: "São Paulo, SP",
      },
      "pt-BR",
    );
    expect(line).toBe("Remoto · Tempo integral · São Paulo, SP");
  });

  it("localizes hybrid and onsite modes", () => {
    expect(
      jobMetaLine(
        { workMode: RemotePolicy.HYBRID, isRemote: false, employmentType: null, location: null },
        "pt-BR",
      ),
    ).toBe("Híbrido");
    expect(
      jobMetaLine(
        { workMode: RemotePolicy.ONSITE, isRemote: false, employmentType: null, location: null },
        "pt-BR",
      ),
    ).toBe("Presencial");
  });

  it("falls back to the legacy isRemote flag when workMode is absent", () => {
    expect(jobMetaLine({ isRemote: true, employmentType: null, location: null }, "pt-BR")).toBe(
      "Remoto",
    );
    expect(jobMetaLine({ isRemote: false, employmentType: null, location: null }, "pt-BR")).toBe(
      "",
    );
  });

  it("localizes the employment type", () => {
    expect(
      jobMetaLine(
        {
          workMode: RemotePolicy.ONSITE,
          isRemote: false,
          employmentType: JobType.INTERNSHIP,
          location: null,
        },
        "en",
      ),
    ).toBe("Onsite · Internship");
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filter set", () => {
    expect(hasActiveFilters(EMPTY_JOBS_FILTERS)).toBe(false);
  });

  it("detects each dimension", () => {
    expect(hasActiveFilters({ ...EMPTY_JOBS_FILTERS, workModes: [RemotePolicy.REMOTE] })).toBe(
      true,
    );
    expect(hasActiveFilters({ ...EMPTY_JOBS_FILTERS, employmentTypes: [JobType.CONTRACT] })).toBe(
      true,
    );
    expect(hasActiveFilters({ ...EMPTY_JOBS_FILTERS, postedWithin: "TODAY" })).toBe(true);
  });
});

describe("activeFilterChips", () => {
  const filters: JobsFilters = {
    workModes: [RemotePolicy.REMOTE, RemotePolicy.HYBRID],
    employmentTypes: [JobType.FULL_TIME],
    postedWithin: "LAST_WEEK",
  };

  it("emits one chip per selected value", () => {
    const chips = activeFilterChips(filters, t, "pt-BR");
    expect(chips.map((c) => c.label)).toEqual([
      "Remoto",
      "Híbrido",
      "Tempo integral",
      "Última semana",
    ]);
  });

  it("each chip removes exactly its own selection", () => {
    const chips = activeFilterChips(filters, t, "pt-BR");
    const withoutHybrid = chips[1]?.remove(filters);
    expect(withoutHybrid?.workModes).toEqual([RemotePolicy.REMOTE]);
    expect(withoutHybrid?.employmentTypes).toEqual([JobType.FULL_TIME]);

    const withoutPosted = chips[3]?.remove(filters);
    expect(withoutPosted?.postedWithin).toBeNull();
    expect(withoutPosted?.workModes).toEqual(filters.workModes);
  });

  it("is empty for the empty filter set", () => {
    expect(activeFilterChips(EMPTY_JOBS_FILTERS, t, "pt-BR")).toEqual([]);
  });
});

describe("groupJobsByPeriod", () => {
  it("buckets by postedAt with fetchedAt fallback, omitting empty sections", () => {
    const jobs = [
      buildJob({ id: "a", postedAt: new Date(NOW - 2 * 3_600_000).toISOString() }),
      buildJob({ id: "b", postedAt: null, fetchedAt: new Date(NOW - 3 * DAY_MS).toISOString() }),
      buildJob({ id: "c", postedAt: new Date(NOW - 10 * DAY_MS).toISOString() }),
    ];
    const sections = groupJobsByPeriod(jobs, NOW);
    expect(sections.map((s) => s.key)).toEqual(["today", "week", "earlier"]);
    expect(sections[0]?.data.map((j) => j.id)).toEqual(["a"]);
    expect(sections[1]?.data.map((j) => j.id)).toEqual(["b"]);
    expect(sections[2]?.data.map((j) => j.id)).toEqual(["c"]);
  });

  it("preserves input order inside each bucket", () => {
    const jobs = [
      buildJob({ id: "x", postedAt: new Date(NOW - 2 * DAY_MS).toISOString() }),
      buildJob({ id: "y", postedAt: new Date(NOW - 3 * DAY_MS).toISOString() }),
    ];
    const sections = groupJobsByPeriod(jobs, NOW);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.data.map((j) => j.id)).toEqual(["x", "y"]);
  });

  it("sends malformed dates to Anteriores", () => {
    const jobs = [buildJob({ id: "bad", postedAt: "not-a-date", fetchedAt: "also-bad" })];
    expect(groupJobsByPeriod(jobs, NOW).map((s) => s.key)).toEqual(["earlier"]);
  });

  it("returns no sections for an empty list", () => {
    expect(groupJobsByPeriod([], NOW)).toEqual([]);
  });
});

describe("setSavedFlag", () => {
  const envelope = {
    items: [buildJob({ id: "a", externalId: "ext-a" }), buildJob({ id: "b", externalId: "ext-b" })],
    total: 2,
  };

  it("flips isSaved/savedId on the matching item of a plain envelope", () => {
    const next = setSavedFlag(envelope, "ext-a", "saved-1");
    expect(next.items[0]).toMatchObject({ isSaved: true, savedId: "saved-1" });
    expect(next.items[1]).toMatchObject({ isSaved: false, savedId: null });
  });

  it("walks infinite pages", () => {
    const infinite = {
      pages: [envelope, { items: [buildJob({ id: "c", externalId: "ext-c" })], total: 1 }],
      pageParams: [1, 2],
    };
    const next = setSavedFlag(infinite, "ext-c", "saved-9");
    expect(next.pages[0]?.items[0]).toMatchObject({ isSaved: false });
    expect(next.pages[1]?.items[0]).toMatchObject({ isSaved: true, savedId: "saved-9" });
  });

  it("clears the flag on unsave", () => {
    const savedEnvelope = {
      items: [buildJob({ id: "a", externalId: "ext-a", isSaved: true, savedId: "saved-1" })],
      total: 1,
    };
    const next = setSavedFlag(savedEnvelope, "ext-a", null);
    expect(next.items[0]).toMatchObject({ isSaved: false, savedId: null });
  });

  it("leaves saved-list rows (no isSaved field) untouched", () => {
    const savedListEnvelope = {
      items: [{ savedId: "saved-1", savedAt: "2026-06-10T00:00:00Z", externalId: "ext-a" }],
      total: 1,
    };
    const next = setSavedFlag(savedListEnvelope, "ext-a", null);
    expect(next.items[0]).toEqual(savedListEnvelope.items[0]);
  });

  it("passes through non-envelope data", () => {
    expect(setSavedFlag(null, "ext-a", null)).toBeNull();
    expect(setSavedFlag({ foo: 1 }, "ext-a", null)).toEqual({ foo: 1 });
  });
});
