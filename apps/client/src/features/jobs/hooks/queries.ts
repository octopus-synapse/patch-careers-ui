/**
 * React-Query glue for the Jobs feature.
 *
 * The generated SDK exposes `getV1JobsExternal` as a plain page-based
 * endpoint; `useExternalJobs` wraps it in an infinite query so the list
 * screen gets endless scroll for free. The query key keeps the generated
 * base element (`{ url: '/api/v1/jobs/external' }`) so `findExternalJob`
 * can locate any cached listing by prefix match — there is no detail
 * endpoint (listings are served exclusively from the daily batch), so the
 * detail screen reads from this cache.
 */

import {
  type GetV1JobsExternalQueryParams,
  type GetV1JobsExternalQueryResponse,
  getV1JobsExternal,
} from "@patch-careers/api-client";
import { keepPreviousData, type QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { ExternalJob, JobsFilters } from "../types";

const PAGE_SIZE = 20;
const LIST_STALE_MS = 5 * 60_000; // batch refreshes daily — no need to refetch per focus
const EXTERNAL_JOBS_BASE = { url: "/api/v1/jobs/external" } as const;

type ListParams = Omit<GetV1JobsExternalQueryParams, "page">;

function filtersToParams(filters: JobsFilters): ListParams {
  const q = filters.q.trim();
  return {
    limit: PAGE_SIZE,
    ...(q.length > 0 ? { q } : {}),
    ...(filters.remoteOnly ? { isRemote: "true" as const } : {}),
    ...(filters.employmentType ? { employmentType: filters.employmentType } : {}),
  };
}

export function useExternalJobs(filters: JobsFilters): {
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
  const params = filtersToParams(filters);
  const query = useInfiniteQuery({
    queryKey: [EXTERNAL_JOBS_BASE, "infinite", params],
    queryFn: ({ pageParam, signal }) =>
      getV1JobsExternal({ ...params, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    staleTime: LIST_STALE_MS,
    // Typing in the search box changes the key per debounce tick; keep the
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

/**
 * Locates a listing in any cached external-jobs query (infinite pages from
 * this feature or plain envelopes from the generated hook). Returns `null`
 * when nothing matches — e.g. a cold deep link before the list ever loaded.
 */
export function findExternalJob(queryClient: QueryClient, id: string): ExternalJob | null {
  const entries = queryClient.getQueriesData<unknown>({ queryKey: [EXTERNAL_JOBS_BASE] });
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
    const pages = (data as { pages: GetV1JobsExternalQueryResponse[] }).pages;
    return pages.flatMap((page) => page.items ?? []);
  }
  if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
    return (data as GetV1JobsExternalQueryResponse).items;
  }
  return [];
}
