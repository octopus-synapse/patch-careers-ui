/**
 * Pure presentation helpers for the Jobs feature.
 *
 * External listings come from the daily JSearch batch: `postedAt` is null
 * for most BR postings (the upstream rarely provides it), so recency labels
 * fall back to `fetchedAt` — the day the listing entered our catalog.
 */

import { JobType, labelFor, RemotePolicy } from "@patch-careers/api-client";
import type { Locale, Translator } from "@patch-careers/i18n";
import type { ExternalJob, JobsFilters, PostedWithin, SavedExternalJobItem } from "../types";

/** Chip order: most common employment types first. */
export const EMPLOYMENT_TYPE_OPTIONS: readonly JobType[] = [
  JobType.FULL_TIME,
  JobType.INTERNSHIP,
  JobType.CONTRACT,
  JobType.PART_TIME,
  JobType.FREELANCE,
  JobType.VOLUNTEER,
];

/** Chip order: strongest BR-tech signal first. */
export const WORK_MODE_OPTIONS: readonly RemotePolicy[] = [
  RemotePolicy.REMOTE,
  RemotePolicy.HYBRID,
  RemotePolicy.ONSITE,
];

/**
 * Posted-date windows exposed in the filter sheet. The backend also accepts
 * LAST_MONTH, but listings are swept after 30 days — "qualquer data" (null)
 * already means the same thing.
 */
export const POSTED_WITHIN_OPTIONS: ReadonlyArray<{
  value: PostedWithin | null;
  labelKey: string;
}> = [
  { value: "TODAY", labelKey: "jobs.postedWithin.today" },
  { value: "LAST_3_DAYS", labelKey: "jobs.postedWithin.last3Days" },
  { value: "LAST_WEEK", labelKey: "jobs.postedWithin.lastWeek" },
  { value: null, labelKey: "jobs.postedWithin.any" },
];

export function employmentTypeLabel(value: JobType, locale: Locale): string {
  return labelFor("JobType", value, locale);
}

export function workModeLabel(value: RemotePolicy, locale: Locale): string {
  return labelFor("RemotePolicy", value, locale);
}

export function postedWithinLabel(value: PostedWithin, t: Translator): string {
  const option = POSTED_WITHIN_OPTIONS.find((o) => o.value === value);
  return option ? t(option.labelKey) : "";
}

/**
 * Relative recency label ("hoje", "há 3 dias"…). Uses `postedAt` when the
 * upstream provided it, else `fetchedAt` (when we first saw the listing).
 */
export function postedAgo(
  job: Pick<ExternalJob, "postedAt" | "fetchedAt">,
  now: number,
  t: Translator,
  locale: Locale,
): string {
  const iso = job.postedAt ?? job.fetchedAt;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((now - then) / 86_400_000);
  if (days <= 0) return t("jobs.recency.today");
  if (days === 1) return t("jobs.recency.yesterday");
  if (days < 30) return t("jobs.recency.daysAgo", { days });
  return new Date(then).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/**
 * The row/detail meta line: "Remoto · Tempo integral · São Paulo, SP".
 * Work mode leads (it's the strongest signal for BR tech candidates);
 * pieces the listing doesn't have are simply omitted. Items cached before
 * the workMode migration fall back to the legacy `isRemote` flag.
 */
export function jobMetaLine(
  job: Pick<ExternalJob, "location" | "employmentType"> &
    Partial<Pick<ExternalJob, "workMode" | "isRemote">>,
  locale: Locale,
): string {
  const parts: string[] = [];
  if (job.workMode) parts.push(workModeLabel(job.workMode, locale));
  else if (job.isRemote) parts.push(workModeLabel(RemotePolicy.REMOTE, locale));
  if (job.employmentType) parts.push(employmentTypeLabel(job.employmentType, locale));
  if (job.location) parts.push(job.location);
  return parts.join(" · ");
}

export function hasActiveFilters(filters: JobsFilters): boolean {
  return (
    filters.workModes.length > 0 ||
    filters.employmentTypes.length > 0 ||
    filters.postedWithin !== null
  );
}

export interface ActiveFilterChip {
  readonly key: string;
  readonly label: string;
  /** Returns the filter set with this one selection removed. */
  readonly remove: (filters: JobsFilters) => JobsFilters;
}

/** One removable chip per selected value (not per filter dimension). */
export function activeFilterChips(
  filters: JobsFilters,
  t: Translator,
  locale: Locale,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  for (const mode of filters.workModes) {
    chips.push({
      key: `mode-${mode}`,
      label: workModeLabel(mode, locale),
      remove: (f) => ({ ...f, workModes: f.workModes.filter((m) => m !== mode) }),
    });
  }
  for (const type of filters.employmentTypes) {
    chips.push({
      key: `type-${type}`,
      label: employmentTypeLabel(type, locale),
      remove: (f) => ({ ...f, employmentTypes: f.employmentTypes.filter((t) => t !== type) }),
    });
  }
  if (filters.postedWithin !== null) {
    chips.push({
      key: `posted-${filters.postedWithin}`,
      label: postedWithinLabel(filters.postedWithin, t),
      remove: (f) => ({ ...f, postedWithin: null }),
    });
  }
  return chips;
}

export interface JobSection {
  readonly key: "today" | "week" | "earlier";
  readonly data: ExternalJob[];
}

/**
 * Buckets the (server-ordered) list into editorial period sections —
 * today / week / earlier — by `postedAt ?? fetchedAt` age. Display titles
 * are the renderer's job (`t("jobs.sections.<key>")`). Input order is
 * preserved inside each bucket; empty sections are omitted; malformed
 * dates land in "earlier".
 */
export function groupJobsByPeriod(jobs: readonly ExternalJob[], now: number): JobSection[] {
  const today: ExternalJob[] = [];
  const week: ExternalJob[] = [];
  const earlier: ExternalJob[] = [];
  for (const job of jobs) {
    const then = new Date(job.postedAt ?? job.fetchedAt).getTime();
    const days = Number.isNaN(then) ? Number.POSITIVE_INFINITY : (now - then) / 86_400_000;
    if (days < 1) today.push(job);
    else if (days < 7) week.push(job);
    else earlier.push(job);
  }
  const sections: JobSection[] = [];
  if (today.length > 0) sections.push({ key: "today", data: today });
  if (week.length > 0) sections.push({ key: "week", data: week });
  if (earlier.length > 0) sections.push({ key: "earlier", data: earlier });
  return sections;
}

/**
 * Normalizes a saved-list row into the `ExternalJob` shape the list/detail
 * render: `savedId` doubles as the route id (the original listing row may
 * already have been swept server-side).
 */
export function normalizeSavedJob(item: SavedExternalJobItem): ExternalJob {
  return {
    id: item.savedId,
    externalId: item.externalId,
    title: item.title,
    company: item.company,
    location: item.location,
    isRemote: item.isRemote,
    workMode: item.workMode,
    employmentType: item.employmentType,
    applyUrl: item.applyUrl,
    publisher: item.publisher,
    description: item.description,
    postedAt: item.postedAt,
    fetchedAt: item.fetchedAt,
    isSaved: true,
    savedId: item.savedId,
  };
}

/**
 * Pure cache writer for the optimistic save toggle: flips `isSaved`/`savedId`
 * on every item matching `externalId` inside an infinite-query (`pages[]`) or
 * plain envelope. Saved-list envelopes (rows keyed by `savedAt`) are left
 * untouched — their membership is refreshed by invalidation instead.
 */
export function setSavedFlag<T>(data: T, externalId: string, savedId: string | null): T {
  if (!data || typeof data !== "object") return data;
  if ("pages" in data && Array.isArray((data as { pages: unknown }).pages)) {
    const infinite = data as T & { pages: unknown[] };
    return { ...infinite, pages: infinite.pages.map((p) => setSavedFlag(p, externalId, savedId)) };
  }
  if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
    const envelope = data as T & { items: unknown[] };
    return {
      ...envelope,
      items: envelope.items.map((item) => {
        if (!item || typeof item !== "object") return item;
        const row = item as Record<string, unknown>;
        if (row.externalId !== externalId || !("isSaved" in row)) return item;
        return { ...row, isSaved: savedId !== null, savedId };
      }),
    };
  }
  return data;
}
