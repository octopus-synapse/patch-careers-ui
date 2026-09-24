import { getV1JobsRecommended } from "@patch-careers/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { usePatchPlan } from "@/features/billing";
import { useAuthState } from "@/providers/auth-provider";
import {
  matchesDiscoveryFilters,
  type Opportunity,
  similarToSaved,
  uniqueOpportunities,
  type WorkspaceEntry,
} from "../lib/discovery";
import { EMPTY_JOBS_FILTERS, type JobsFilters } from "../types";
import { useExternalJobs } from "./queries";

/** Filters refine all three groups. Each list can page further without capping the catalog. */
export function useDiscovery(filters: JobsFilters, entries: WorkspaceEntry[]) {
  const { currentUser } = useAuthState();
  const { canUsePaid } = usePatchPlan();
  const catalog = useExternalJobs(filters, "all", 12);
  const saved = useExternalJobs(EMPTY_JOBS_FILTERS, "saved");
  const recommendedQuery = useInfiniteQuery({
    queryKey: [{ url: "/api/v1/jobs/recommended" }, currentUser?.userId],
    queryFn: ({ signal, pageParam }) =>
      getV1JobsRecommended({ limit: 12, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    staleTime: 5 * 60_000,
    enabled: canUsePaid,
  });
  const recommendedData = useMemo(
    () =>
      recommendedQuery.data
        ? {
            ...recommendedQuery.data.pages[0],
            items: recommendedQuery.data.pages.flatMap((page) => page.items),
          }
        : undefined,
    [recommendedQuery.data],
  );
  const recommended = { ...recommendedQuery, data: recommendedData };
  const groups = useMemo(() => {
    const now = Date.now();
    const savedByExternalId = new Map(
      saved.jobs.filter((job) => job.isSaved).map((job) => [job.externalId, job.savedId]),
    );
    const live = uniqueOpportunities([...catalog.jobs, ...(recommended.data?.items ?? [])]);
    const liveByExternalId = new Map(live.map((job) => [job.externalId, job]));
    const resolveSaved = (job: Opportunity): Opportunity => {
      const current = liveByExternalId.get(job.externalId);
      const savedId = current
        ? current.savedId
        : (savedByExternalId.get(job.externalId) ??
          (saved.isLoading || saved.hasNextPage ? job.savedId : null));
      return { ...job, isSaved: Boolean(savedId), savedId };
    };
    const recent = entries
      .filter((entry) => entry.viewedAt)
      .sort((a, b) => (b.viewedAt ?? "").localeCompare(a.viewedAt ?? ""))
      .slice(0, 50)
      .map((entry) => liveByExternalId.get(entry.job.externalId) ?? entry.job);
    // The recommendations endpoint ranks against the master. A cold worker cache
    // falls back to the real catalog, sorted by live master scores at presentation.
    const recommendedJobs = recommended.data?.items.length ? recommended.data.items : catalog.jobs;
    return {
      recommended: uniqueOpportunities(recommendedJobs)
        .map(resolveSaved)
        .filter((job) => matchesDiscoveryFilters(job, filters, now)),
      similar: similarToSaved(live, saved.jobs)
        .map(resolveSaved)
        .filter((job) => matchesDiscoveryFilters(job, filters, now)),
      recent: recent.map(resolveSaved).filter((job) => matchesDiscoveryFilters(job, filters, now)),
    };
  }, [
    catalog.jobs,
    saved.jobs,
    saved.isLoading,
    saved.hasNextPage,
    recommended.data,
    entries,
    filters,
  ]);
  return {
    groups,
    catalog,
    saved,
    recommended,
    isLoading: catalog.isLoading || saved.isLoading || (canUsePaid && recommended.isLoading),
  };
}
