/**
 * Jobs feature — public API. The external-listings tab (daily JSearch
 * batch): filterable endless list grouped by period, saved-jobs scope,
 * plus the pushed detail screen. Import only from "@/features/jobs";
 * internal paths are private.
 */
export { JobDetailScreen } from "./components/job-detail-screen";
export { JobsScreen } from "./components/jobs-screen";
export { findExternalJob, useExternalJobs } from "./hooks/queries";
export type { ExternalJob, JobsFilters, JobsScope } from "./types";
