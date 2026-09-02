/**
 * Native stub for `NavBar`. Mobile wears the `AppHeader` + `EditorialTabBar`
 * chrome instead, so this renders nothing — and, more importantly, keeps the
 * whole web bar (with the landing's mascot, the auth dialog and the search
 * palette hanging off it) out of the Hermes bundle.
 *
 * The contract is re-exported so native callers still get the constants and
 * types without reaching a `.web` module.
 */

import type { ReactElement } from "react";
import type { NavAccount, NavBarVariant, NavProgress } from "./nav-bar.contract";

export {
  MENU_PANEL_OFFSET,
  MENU_PANEL_WIDTH,
  NAV_BAR_HEIGHT_APP,
  NAV_BAR_HEIGHT_PUBLIC,
  NAV_CLUSTER_GAP,
  NAV_CONTROL_SIZE,
  NAV_ITEM_WIDTH,
  NAV_SEARCH_WIDTH,
  NAV_TAB_GAP,
  type NavAccount,
  type NavBarVariant,
  type NavProgress,
  PUBLIC_NAV_BAR_HEIGHT,
} from "./nav-bar.contract";

export type NavBarProps = {
  readonly variant: NavBarVariant;
  readonly progress?: NavProgress;
  readonly account?: NavAccount;
};

export function NavBar(_props: NavBarProps): ReactElement | null {
  return null;
}
