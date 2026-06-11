import { JobType } from "@patch-careers/api-client";
import { describe, expect, it } from "vitest";
import { EMPTY_JOBS_FILTERS } from "../types";
import { hasActiveFilters, jobMetaLine, postedAgo } from "./helpers";

const DAY_MS = 86_400_000;
const NOW = new Date("2026-06-11T12:00:00Z").getTime();

describe("postedAgo", () => {
  it("uses postedAt when present", () => {
    const job = {
      postedAt: new Date(NOW - 3 * DAY_MS).toISOString(),
      fetchedAt: new Date(NOW).toISOString(),
    };
    expect(postedAgo(job, NOW)).toBe("há 3 dias");
  });

  it("falls back to fetchedAt when postedAt is null", () => {
    const job = { postedAt: null, fetchedAt: new Date(NOW - DAY_MS).toISOString() };
    expect(postedAgo(job, NOW)).toBe("ontem");
  });

  it("labels same-day listings as hoje", () => {
    const job = { postedAt: null, fetchedAt: new Date(NOW - 60_000).toISOString() };
    expect(postedAgo(job, NOW)).toBe("hoje");
  });

  it("returns empty string for malformed dates", () => {
    expect(postedAgo({ postedAt: "not-a-date", fetchedAt: "also-bad" }, NOW)).toBe("");
  });
});

describe("jobMetaLine", () => {
  it("joins remote, type and location with dots", () => {
    const line = jobMetaLine(
      { isRemote: true, employmentType: JobType.FULL_TIME, location: "São Paulo, SP" },
      "pt-BR",
    );
    expect(line).toBe("Remoto · Tempo integral · São Paulo, SP");
  });

  it("omits missing pieces", () => {
    expect(jobMetaLine({ isRemote: false, employmentType: null, location: null }, "pt-BR")).toBe(
      "",
    );
    expect(jobMetaLine({ isRemote: true, employmentType: null, location: null }, "pt-BR")).toBe(
      "Remoto",
    );
  });

  it("localizes the employment type", () => {
    expect(
      jobMetaLine({ isRemote: false, employmentType: JobType.INTERNSHIP, location: null }, "en"),
    ).toBe("Internship");
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filter set", () => {
    expect(hasActiveFilters(EMPTY_JOBS_FILTERS)).toBe(false);
  });

  it("detects each dimension", () => {
    expect(hasActiveFilters({ ...EMPTY_JOBS_FILTERS, q: "react" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_JOBS_FILTERS, remoteOnly: true })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_JOBS_FILTERS, employmentType: JobType.CONTRACT })).toBe(
      true,
    );
  });

  it("ignores whitespace-only queries", () => {
    expect(hasActiveFilters({ ...EMPTY_JOBS_FILTERS, q: "   " })).toBe(false);
  });
});
