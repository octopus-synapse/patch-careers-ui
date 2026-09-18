import { EMPTY_JOBS_FILTERS, type JobsFilters, type JobsScope, type PostedWithin } from "../types";
import { DISCOVERY_GROUPS, type DiscoveryGroup } from "./discovery";
import { EMPLOYMENT_TYPE_OPTIONS, WORK_MODE_OPTIONS } from "./helpers";

const first = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
export function readDiscoveryRoute(params: Record<string, string | string[] | undefined>) {
  const rawScope = first(params.scope);
  const scope: JobsScope = rawScope === "saved" || rawScope === "applications" ? rawScope : "all";
  const rawGroup = first(params.group);
  const group = DISCOVERY_GROUPS.includes(rawGroup as DiscoveryGroup)
    ? (rawGroup as DiscoveryGroup)
    : null;
  const period = first(params.period);
  const filters: JobsFilters = {
    search: first(params.q).slice(0, 200),
    location: first(params.location).slice(0, 200),
    workModes: WORK_MODE_OPTIONS.filter((value) => first(params.mode).split(",").includes(value)),
    employmentTypes: EMPLOYMENT_TYPE_OPTIONS.filter((value) =>
      first(params.type).split(",").includes(value),
    ),
    postedWithin: ["TODAY", "LAST_3_DAYS", "LAST_WEEK", "LAST_MONTH"].includes(period)
      ? (period as PostedWithin)
      : null,
  };
  return { scope, group, filters };
}

export function discoveryParams(
  scope: JobsScope,
  group: DiscoveryGroup | null,
  filters: JobsFilters = EMPTY_JOBS_FILTERS,
) {
  return {
    scope,
    group: group ?? "",
    q: filters.search ?? "",
    location: filters.location ?? "",
    mode: filters.workModes.join(","),
    type: filters.employmentTypes.join(","),
    period: filters.postedWithin ?? "",
  };
}
