/**
 * useGlobalSearch — debounced glue over `GET /v1/search/global` for the
 * search modal. Ported from the old header dropdown: 250ms trailing
 * debounce, 2-char minimum, empty groups filtered out.
 */

import { useGetV1SearchGlobal } from "@patch-careers/api-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchGroup } from "../types";

export const SEARCH_MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

export function useGlobalSearch(term: string): {
  groups: SearchGroup[];
  isLoading: boolean;
  /** True once the (debounced) term is long enough to query. */
  enabled: boolean;
  /** The debounced term the current results answer to (for "no results" copy). */
  debounced: string;
} {
  const debounced = useDebouncedValue(term.trim(), DEBOUNCE_MS);
  const enabled = debounced.length >= SEARCH_MIN_CHARS;
  const search = useGetV1SearchGlobal({ q: debounced }, { query: { enabled, staleTime: 10_000 } });
  const groups = (enabled ? (search.data?.groups ?? []) : []).filter((g) => g.items.length > 0);
  return { groups, isLoading: enabled && search.isLoading, enabled, debounced };
}
