import { onDestroy } from 'svelte';
import type { Readable } from 'svelte/store';

/**
 * Canonical paginated response envelope (backend Q1 — see profile-services
 * `shared-kernel/schemas/common/api.types.ts` `PaginatedResponseSchema`).
 */
type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type QueryHandle<T> = Readable<{
  data?: Page<T> | undefined;
  isLoading: boolean;
  isError?: boolean;
}>;

interface UseInfiniteListOptions<T> {
  /**
   * Hook factory closing over the static path/query params. Receives only
   * pagination params (`page`, `limit`); returns a Svelte readable store
   * with `data: Page<T>` (or undefined while loading / disabled).
   *
   * Example: `(p) => createGetV1UsersUserIdFollowers(userId, p, { query: { enabled } })`.
   */
  createQuery: (params: { page: number; limit: number }) => QueryHandle<T>;

  /**
   * Plain-client fetcher closing over the same static params. Used by
   * `loadMore()` to append subsequent pages without restarting the query.
   *
   * Example: `(p) => getV1UsersUserIdFollowers(userId, p)`.
   */
  fetcher: (params: { page: number; limit: number }) => Promise<Page<T>>;

  /** Defaults to 20. */
  pageSize?: number;

  /** Optional row-level filter applied to the merged list (first page + extras). */
  filter?: (row: T) => boolean;
}

/**
 * Centralized helper for offset-paginated infinite-scroll lists.
 *
 * Every paginated route page (followers, following, connections,
 * suggestions, saved jobs, search results, etc.) was duplicating the same
 * ~25 lines of `firstPage / extra / pageNum / loadingMore / loadMore`
 * scaffolding. This helper owns that pattern. Consumers read
 * `list.items`, `list.hasMore`, `list.loadingMore` and call
 * `list.loadMore()`. If the backend reshapes pagination (cursor-based, new
 * field names) only this file changes — components stay untouched.
 *
 * Bridging TanStack Svelte Query → Svelte 5 runes: same pattern as
 * `useAuth` / `useFeatureFlags` / `usePermissions`. The TanStack store is
 * non-reactive in `$derived`, so we subscribe explicitly and mirror the
 * latest snapshot into a `$state` record. Consumers' `$derived(list.items)`
 * then re-evaluates when the page resolves; before the fix, the snapshot
 * read inside `$derived` was a one-shot `get(query)` and never updated.
 *
 * Coupling notes:
 * - Backend response is the canonical `Page<T>` envelope from Q1. Any
 *   endpoint that returns a custom shape (`{ users: [...] }`,
 *   `{ comments: [...] }`) must be standardized in the backend before its
 *   route can adopt this helper. Don't add adapters here — keep frontend
 *   burro.
 * - `createQuery` and `fetcher` come from kubb's generated SDK. Their
 *   signatures are fixed by the OpenAPI contract; the closures bind any
 *   path params (e.g. userId) before passing pagination args.
 */
export function useInfiniteList<T>(opts: UseInfiniteListOptions<T>) {
  const pageSize = opts.pageSize ?? 20;

  const query = opts.createQuery({ page: 1, limit: pageSize });

  let snapshot = $state<{
    data: Page<T> | undefined;
    isLoading: boolean;
    isError: boolean;
  }>({ data: undefined, isLoading: true, isError: false });

  const unsubscribe = query.subscribe((value) => {
    snapshot = {
      data: value.data,
      isLoading: value.isLoading,
      isError: value.isError ?? false,
    };
  });
  onDestroy(unsubscribe);

  let extra = $state<T[]>([]);
  let pageNum = $state(1);
  let loadingMore = $state(false);

  function applyFilter(rows: T[]): T[] {
    return opts.filter ? rows.filter(opts.filter) : rows;
  }

  async function loadMore(): Promise<void> {
    if (loadingMore) return;
    if (!snapshot.data?.hasNext) return;
    loadingMore = true;
    try {
      const next = pageNum + 1;
      const page = await opts.fetcher({ page: next, limit: pageSize });
      extra = [...extra, ...page.items];
      pageNum = next;
    } finally {
      loadingMore = false;
    }
  }

  function reset(): void {
    extra = [];
    pageNum = 1;
    loadingMore = false;
  }

  return {
    /** Raw query handle — for `isLoading`, `isError`, etc. */
    query,
    /** First page items + appended extras, optionally filtered. */
    get items(): T[] {
      const head = snapshot.data?.items ?? [];
      return applyFilter([...head, ...extra]);
    },
    /** Total reported by the backend (across all pages). */
    get total(): number {
      return snapshot.data?.total ?? 0;
    },
    /** True while the first page is being fetched. */
    get isLoading(): boolean {
      return snapshot.isLoading;
    },
    /** True if the first-page query errored. */
    get isError(): boolean {
      return snapshot.isError;
    },
    /** True if there's at least one more page to load. */
    get hasMore(): boolean {
      if (!snapshot.data) return false;
      return pageNum < snapshot.data.totalPages;
    },
    /** True while a `loadMore()` is in flight. */
    get loadingMore(): boolean {
      return loadingMore;
    },
    /** Current page number (1-indexed). */
    get page(): number {
      return pageNum;
    },
    loadMore,
    reset,
  };
}
