/**
 * Jobs feature — public API. The external-listings tab (daily JSearch
 * batch): searchable, filterable endless list plus the pushed detail
 * screen. Import only from "@/features/jobs"; internal paths are private.
 */
export { JobDetailScreen } from "./components/job-detail-screen";
export { JobsScreen } from "./components/jobs-screen";
export { findExternalJob, useExternalJobs } from "./hooks/queries";
export type { ExternalJob, JobsFilters } from "./types";
