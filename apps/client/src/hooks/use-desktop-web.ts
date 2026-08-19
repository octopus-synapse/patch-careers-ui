/**
 * Desktop-web detection + the shared metrics of the desktop chrome.
 *
 * At `>= DESKTOP_WEB_BREAKPOINT` on web the app swaps its mobile chrome
 * (AppHeader + bottom EditorialTabBar) for a single LinkedIn-style top
 * navbar (`WebNavBar`) and constrains every stack scene to a centered
 * column (`DESKTOP_CONTENT_MAX_WIDTH`). Narrow web windows keep the
 * mobile chrome — a phone browser behaves like the phone app.
 */

import { Platform, useWindowDimensions } from "react-native";

// Below this the mobile chrome (bottom bar + AppHeader) fits better — tablet
// portrait and split windows included. The full WebNavBar row (wordmark +
// search + five labeled destinations + account) needs ~1000px to breathe.
export const DESKTOP_WEB_BREAKPOINT = 1024;

/**
 * The centered content column. Sized for the app's single-column screens
 * (list rows, the master-resume manager) — wide enough to breathe, narrow
 * enough that rows don't stretch into unreadable lines. The WebNavBar's
 * inner row uses the same cap so the chrome and the content share edges.
 */
export const DESKTOP_CONTENT_MAX_WIDTH = 960;

export function useIsDesktopWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= DESKTOP_WEB_BREAKPOINT;
}
