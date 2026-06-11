/**
 * Jobs feature types. `ExternalJob` mirrors one item of the
 * `GET /v1/jobs/external` envelope — derived from the generated SDK type so
 * a backend schema change breaks the build here instead of at runtime.
 */

import type { GetV1JobsExternal200, JobType } from "@patch-careers/api-client";

export type ExternalJob = GetV1JobsExternal200["items"][number];

export type JobsFilters = {
  /** Free-text search over title/company (backend `q`). */
  readonly q: string;
  /** `true` filters to remote-only; `null` means "any". */
  readonly remoteOnly: boolean;
  /** Single-select employment type; `null` means "all types". */
  readonly employmentType: JobType | null;
};

export const EMPTY_JOBS_FILTERS: JobsFilters = {
  q: "",
  remoteOnly: false,
  employmentType: null,
};
