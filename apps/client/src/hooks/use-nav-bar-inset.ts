/**
 * `useNavBarInset` — how far a scrolling screen must start below the top of the
 * window on desktop web, where the navbar floats OVER the scene.
 *
 * The bar is frosted, and frosted glass only reads when live content passes
 * under it. So the scene is full-height and each scroller pads its CONTENT
 * (never its box) by this much: the first row starts clear of the bar, and
 * everything after slides under it.
 *
 * The mirror image of the `useBottomTabBarHeight()` padding these same screens
 * already carry for the floating mobile tab bar — 0 wherever the bar isn't.
 */

import { NAV_BAR_HEIGHT_APP } from "@/components/nav-bar/nav-bar.contract";
import { useIsDesktopWeb } from "./use-desktop-web";

export function useNavBarInset(): number {
  return useIsDesktopWeb() ? NAV_BAR_HEIGHT_APP : 0;
}
