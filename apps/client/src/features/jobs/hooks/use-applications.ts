/**
 * React-Query glue for the Candidaturas scope (folded in from the retired
 * Candidaturas tab). It unifies two sources into one display list:
 *
 *   • internal applications — `GET /v1/jobs/applications` (real status)
 *   • external self-reported — saved external jobs the user marked "applied"
 *     (`hasApplied === true`) via the "você se candidatou?" prompt
 *
 * Both are normalized to `ApplicationRow`, merged newest-first and bucketed by
 * status for the section list. External listings apply off-app, so they have
 * no recruiter-driven status — they always read as "in review".
 */

import { getV1JobsApplications, getV1JobsExternalSaved } from "@patch-careers/api-client";
import { useQuery } from "@tanstack/react-query";

export type ApplicationStatusBucket = "review" | "response" | "closed";

export interface ApplicationRow {
  readonly id: string;
  readonly source: "internal" | "external";
  readonly title: string;
  readonly company: string;
  readonly location: string | null;
  /** Raw enum value (labelled in the row via `labelFor`); null when unknown. */
  readonly workMode: string | null;
  readonly employmentType: string | null;
  /** ISO timestamp the application was made (or self-reported). */
  readonly appliedAtIso: string;
  readonly status: ApplicationStatusBucket;
  /** Detail route id when the row maps to a cached job (external = savedId). */
  readonly jobRouteId: string | null;
}

export interface ApplicationSection {
  readonly key: ApplicationStatusBucket;
  readonly data: ApplicationRow[];
}

const APPLICATIONS_KEY = [{ url: "/api/v1/jobs/applications" }, "candidaturas-scope"] as const;
const PAGE_LIMIT = 50;

/** Maps the internal application status enum onto a display bucket. */
function bucketForInternalStatus(status: string): ApplicationStatusBucket {
  switch (status) {
    case "ACCEPTED":
      return "response";
    case "REJECTED":
    case "WITHDRAWN":
      return "closed";
    default:
      // SUBMITTED / VIEWED (and anything new) → still in review.
      return "review";
  }
}

const BUCKET_ORDER: readonly ApplicationStatusBucket[] = ["review", "response", "closed"];

function groupByStatus(rows: readonly ApplicationRow[]): ApplicationSection[] {
  const sections: ApplicationSection[] = [];
  for (const key of BUCKET_ORDER) {
    const data = rows.filter((r) => r.status === key);
    if (data.length > 0) sections.push({ key, data });
  }
  return sections;
}

/**
 * Fetches both sources in one query (a single page each — applications lists
 * are small) and merges them. Kept off `useInfiniteQuery` on purpose: blending
 * two independently-paginated sources into one endless scroll is not worth the
 * complexity for the 15%-of-traffic Candidaturas scope.
 */
export function useApplications(enabled: boolean): {
  sections: ApplicationSection[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
} {
  const query = useQuery({
    enabled,
    queryKey: APPLICATIONS_KEY,
    queryFn: async ({ signal }): Promise<ApplicationRow[]> => {
      const [internal, saved] = await Promise.all([
        getV1JobsApplications({ limit: PAGE_LIMIT, page: 1 }, { signal }),
        getV1JobsExternalSaved({ limit: PAGE_LIMIT, page: 1 }, { signal }),
      ]);

      const internalRows: ApplicationRow[] = internal.items.map((app) => ({
        id: `internal-${app.id}`,
        source: "internal",
        title: app.job.title,
        company: app.job.company,
        location: app.job.location,
        workMode: app.job.remotePolicy ?? null,
        employmentType: app.job.jobType ?? null,
        appliedAtIso: app.createdAt,
        status: bucketForInternalStatus(app.status),
        jobRouteId: null,
      }));

      const externalRows: ApplicationRow[] = saved.items
        .filter((row) => row.hasApplied === true)
        .map((row) => ({
          id: `external-${row.savedId}`,
          source: "external",
          title: row.title,
          company: row.company,
          location: row.location,
          workMode: row.workMode ?? null,
          employmentType: row.employmentType ?? null,
          appliedAtIso: row.appliedAt ?? row.savedAt,
          status: "review",
          jobRouteId: row.savedId,
        }));

      return [...internalRows, ...externalRows].sort((a, b) =>
        b.appliedAtIso.localeCompare(a.appliedAtIso),
      );
    },
    staleTime: 60_000,
  });

  const rows = query.data ?? [];
  return {
    sections: groupByStatus(rows),
    total: rows.length,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
