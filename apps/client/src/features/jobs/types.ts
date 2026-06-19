/**
 * Jobs feature types. `ExternalJob` mirrors one item of the
 * `GET /v1/jobs/external` envelope — derived from the generated SDK type so
 * a backend schema change breaks the build here instead of at runtime.
 */

import type {
  GetV1JobsExternal200,
  GetV1JobsExternalQueryParamsPostedWithinEnum,
  GetV1JobsExternalSaved200,
  JobType,
  RemotePolicy,
} from "@patch-careers/api-client";

export type ExternalJob = GetV1JobsExternal200["items"][number];

/** One row of `GET /v1/jobs/external/saved` — a snapshot, keyed by `savedId`. */
export type SavedExternalJobItem = GetV1JobsExternalSaved200["items"][number];

export type PostedWithin = GetV1JobsExternalQueryParamsPostedWithinEnum;

/**
 * Which list the Vagas tab shows:
 *   • `all`          — every external listing (discovery, the default)
 *   • `saved`        — the user's saved snapshots
 *   • `applications` — the user's applications (internal + self-reported
 *                      external), folded in from the retired Candidaturas tab.
 */
export type JobsScope = "all" | "saved" | "applications";

export type JobsFilters = {
  /** Any-of work modes (Presencial/Híbrido/Remoto); empty means "any". */
  readonly workModes: readonly RemotePolicy[];
  /** Any-of employment types; empty means "any". */
  readonly employmentTypes: readonly JobType[];
  /** Posted-date window; `null` means "qualquer data". */
  readonly postedWithin: PostedWithin | null;
};

export const EMPTY_JOBS_FILTERS: JobsFilters = {
  workModes: [],
  employmentTypes: [],
  postedWithin: null,
};
