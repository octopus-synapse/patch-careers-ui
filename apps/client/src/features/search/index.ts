/**
 * Search feature — public API. The DocSearch-style fullscreen global search:
 * the header's trigger pill + the modal it opens (grouped live results,
 * persisted recents, Explorar shortcuts). Import only from
 * "@/features/search"; internal paths are private.
 */
export { SearchModal } from "./components/search-modal";
export { SearchTrigger } from "./components/search-trigger";
export type { RecentSearchItem } from "./types";
