/** Search feature types — derived from the global-search SDK response. */

import type { GetV1SearchGlobalQueryResponse, GroupsTypeEnum } from "@patch-careers/api-client";
import type { ComponentType } from "react";

/** One grouped section of the `GET /v1/search/global` response. */
export type SearchGroup = GetV1SearchGlobalQueryResponse["groups"][number];

/** One tappable result inside a group. */
export type SearchResultItem = SearchGroup["items"][number];

/**
 * A previously selected result, persisted as a shortcut (DocSearch-style
 * recents). `type` keeps the group it came from so the row can show context.
 */
export type RecentSearchItem = {
  id: string;
  title: string;
  snippet?: string | undefined;
  badge?: string | undefined;
  href: string;
  type: GroupsTypeEnum;
};

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };

/** Static "Explorar" navigation shortcut shown in the empty state. */
export type ExploreShortcut = {
  icon: ComponentType<GlyphProps>;
  label: string;
  href: string;
};
