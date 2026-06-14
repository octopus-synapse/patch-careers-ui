/**
 * React-Query glue for the Jobs feature.
 *
 * The generated SDK exposes `getV1JobsExternal` / `getV1JobsExternalSaved`
 * as plain page-based endpoints; `useExternalJobs` wraps the scoped one in
 * an infinite query so the list screen gets endless scroll for free. Query
 * keys keep the generated base elements so `findExternalJob` can locate any
 * cached listing by prefix match — there is no detail endpoint, so the
 * detail screen reads from these caches (saved rows included).
 */

import {
  type GetV1JobsExternalQueryParams,
  type GetV1JobsExternalQueryResponse,
  type GetV1JobsExternalSavedQueryResponse,
  getV1JobsExternal,
  getV1JobsExternalSaved,
} from "@patch-careers/api-client";
import { keepPreviousData, type QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { normalizeSavedJob } from "../lib/helpers";
import type { ExternalJob, JobsFilters, JobsScope } from "../types";

const PAGE_SIZE = 20;
const LIST_STALE_MS = 5 * 60_000; // batch refreshes daily — no need to refetch per focus
export const EXTERNAL_JOBS_BASE = { url: "/api/v1/jobs/external" } as const;
export const SAVED_JOBS_BASE = { url: "/api/v1/jobs/external/saved" } as const;

type ListParams = Omit<GetV1JobsExternalQueryParams, "page">;

/**
 * The only place that knows the multi-select wire encoding (CSV — the
 * backend documents `workMode`/`employmentType` as comma-separated).
 */
export function filtersToParams(filters: JobsFilters): ListParams {
  return {
    limit: PAGE_SIZE,
    ...(filters.workModes.length > 0 ? { workMode: filters.workModes.join(",") } : {}),
    ...(filters.employmentTypes.length > 0
      ? { employmentType: filters.employmentTypes.join(",") }
      : {}),
    ...(filters.postedWithin !== null ? { postedWithin: filters.postedWithin } : {}),
  };
}

/** Both scopes are normalized to this page shape before caching. */
type JobsPage = {
  items: ExternalJob[];
  total: number;
  page: number;
  hasNext: boolean;
};

export function useExternalJobs(
  filters: JobsFilters,
  scope: JobsScope,
): {
  jobs: ExternalJob[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
} {
  // The saved list is a snapshot archive — filters only apply to "all".
  const params = scope === "all" ? filtersToParams(filters) : { limit: PAGE_SIZE };
  const query = useInfiniteQuery({
    queryKey: [scope === "all" ? EXTERNAL_JOBS_BASE : SAVED_JOBS_BASE, "infinite", params],
    queryFn: async ({ pageParam, signal }): Promise<JobsPage> => {
      if (scope === "all") {
        const page = await getV1JobsExternal({ ...params, page: pageParam }, { signal });
        return { items: page.items, total: page.total, page: page.page, hasNext: page.hasNext };
      }
      const page = await getV1JobsExternalSaved({ limit: PAGE_SIZE, page: pageParam }, { signal });
      // Saved rows are normalized up front so the cache (and therefore the
      // optimistic save toggle + detail lookup) sees one item shape.
      return {
        items: page.items.map(normalizeSavedJob),
        total: page.total,
        page: page.page,
        hasNext: page.hasNext,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    staleTime: LIST_STALE_MS,
    // Applying filters (or switching scope) changes the key; keep the
    // previous list on screen instead of flashing the skeleton.
    placeholderData: keepPreviousData,
  });

  const pages = query.data?.pages ?? [];
  return {
    jobs: pages.flatMap((page) => page.items),
    total: pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
}

type AnyEnvelope = GetV1JobsExternalQueryResponse | GetV1JobsExternalSavedQueryResponse;

/**
 * Raw saved-list envelopes (from the generated hook, not this feature's
 * normalized cache) carry `savedId` instead of `id` on the first item.
 */
function isSavedEnvelope(page: AnyEnvelope): page is GetV1JobsExternalSavedQueryResponse {
  const first = page.items[0] as Record<string, unknown> | undefined;
  return first !== undefined && !("id" in first) && "savedId" in first;
}

/**
 * Locates a listing in any cached external-jobs query — the live list, the
 * saved list (rows normalized so `savedId` doubles as the id), or plain
 * envelopes from the generated hooks. Returns `null` when nothing matches —
 * e.g. a cold deep link before either list ever loaded.
 */
export function findExternalJob(queryClient: QueryClient, id: string): ExternalJob | null {
  const entries = [
    ...queryClient.getQueriesData<unknown>({ queryKey: [EXTERNAL_JOBS_BASE] }),
    ...queryClient.getQueriesData<unknown>({ queryKey: [SAVED_JOBS_BASE] }),
  ];
  for (const [, data] of entries) {
    for (const job of iterateJobs(data)) {
      if (job.id === id) return job;
    }
  }
  return null;
}

function iterateJobs(data: unknown): ExternalJob[] {
  if (!data || typeof data !== "object") return [];
  if ("pages" in data && Array.isArray((data as { pages: unknown }).pages)) {
    const pages = (data as { pages: unknown[] }).pages;
    return pages.flatMap((page) => iterateJobs(page));
  }
  if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
    const page = data as AnyEnvelope;
    return isSavedEnvelope(page) ? page.items.map(normalizeSavedJob) : page.items;
  }
  return [];
}
