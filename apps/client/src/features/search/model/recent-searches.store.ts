/**
 * Recent searches — the results the user actually opened (DocSearch-style
 * recents), persisted so the search modal's empty state offers shortcuts
 * back to them. App-specific, so it lives in the feature and only borrows
 * the persisted-store scaffold from `@patch-careers/state`.
 */

import { groupsTypeEnum } from "@patch-careers/api-client";
import { createPersistedStore } from "@patch-careers/state";
import { mundane } from "@patch-careers/storage";
import type { RecentSearchItem } from "../types";

export const RECENT_SEARCHES_STORE_KEY = "patch-careers:recent-searches";
export const RECENT_SEARCHES_STORE_VERSION = 1;

/** Keep the list shortcut-sized — old entries fall off the end. */
const MAX_RECENTS = 8;

interface RecentSearchesData {
  items: RecentSearchItem[];
}
interface RecentSearchesActions {
  add: (item: RecentSearchItem) => void;
  remove: (href: string) => void;
  clear: () => void;
}

const GROUP_TYPES = new Set<string>(Object.values(groupsTypeEnum));

function isRecentSearchItem(value: unknown): value is RecentSearchItem {
  if (value === null || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.href === "string" &&
    typeof item.type === "string" &&
    GROUP_TYPES.has(item.type) &&
    (item.snippet === undefined || typeof item.snippet === "string") &&
    (item.badge === undefined || typeof item.badge === "string")
  );
}

export const useRecentSearchesStore = createPersistedStore<
  RecentSearchesData,
  RecentSearchesActions
>({
  key: RECENT_SEARCHES_STORE_KEY,
  version: RECENT_SEARCHES_STORE_VERSION,
  storage: mundane,
  initialData: { items: [] },
  createActions: (set, get) => ({
    add: (item) =>
      set({
        items: [item, ...get().items.filter((i) => i.href !== item.href)].slice(0, MAX_RECENTS),
      }),
    remove: (href) => set({ items: get().items.filter((i) => i.href !== href) }),
    clear: () => set({ items: [] }),
  }),
  validate: (persisted) => {
    if (
      persisted !== null &&
      typeof persisted === "object" &&
      "items" in persisted &&
      Array.isArray((persisted as { items: unknown }).items)
    ) {
      const items = (persisted as { items: unknown[] }).items;
      return { items: items.filter(isRecentSearchItem).slice(0, MAX_RECENTS) };
    }
    return null;
  },
});
