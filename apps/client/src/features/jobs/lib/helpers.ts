/**
 * Pure presentation helpers for the Jobs feature.
 *
 * External listings come from the daily JSearch batch: `postedAt` is null
 * for most BR postings (the upstream rarely provides it), so recency labels
 * fall back to `fetchedAt` — the day the listing entered our catalog.
 */

import { JobType, labelFor } from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import type { ExternalJob, JobsFilters } from "../types";

/** Chip order: most common employment types first. */
export const EMPLOYMENT_TYPE_OPTIONS: readonly JobType[] = [
  JobType.FULL_TIME,
  JobType.INTERNSHIP,
  JobType.CONTRACT,
  JobType.PART_TIME,
  JobType.FREELANCE,
  JobType.VOLUNTEER,
];

export function employmentTypeLabel(value: JobType, locale: Locale): string {
  return labelFor("JobType", value, locale);
}

/**
 * Relative recency label ("hoje", "há 3 dias"…). Uses `postedAt` when the
 * upstream provided it, else `fetchedAt` (when we first saw the listing).
 */
export function postedAgo(job: Pick<ExternalJob, "postedAt" | "fetchedAt">, now: number): string {
  const iso = job.postedAt ?? job.fetchedAt;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((now - then) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  return new Date(then).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

/**
 * The card/detail meta line: "Remoto · Tempo integral · São Paulo, SP".
 * Remote leads (it's the strongest signal for BR tech candidates); pieces
 * the listing doesn't have are simply omitted.
 */
export function jobMetaLine(
  job: Pick<ExternalJob, "isRemote" | "location" | "employmentType">,
  locale: Locale,
): string {
  const parts: string[] = [];
  if (job.isRemote) parts.push("Remoto");
  if (job.employmentType) parts.push(employmentTypeLabel(job.employmentType, locale));
  if (job.location) parts.push(job.location);
  return parts.join(" · ");
}

export function hasActiveFilters(filters: JobsFilters): boolean {
  return filters.q.trim().length > 0 || filters.remoteOnly || filters.employmentType !== null;
}
