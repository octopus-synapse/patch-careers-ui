/**
 * Desktop-web detection + the shared metrics of the desktop chrome.
 *
 * At `>= DESKTOP_WEB_BREAKPOINT` on web the app swaps its mobile chrome
 * (AppHeader + bottom EditorialTabBar) for a single full-bleed top
 * navbar (`NavBar variant="app"`) and constrains every stack scene to a centered
 * column (`DESKTOP_CONTENT_MAX_WIDTH`). Narrow web windows keep the
 * mobile chrome — a phone browser behaves like the phone app.
 */

import { Platform, useWindowDimensions } from "react-native";

// Below this the mobile chrome (bottom bar + AppHeader) fits better — tablet
// portrait and split windows included. The bar's centred cluster (search + four
// labeled destinations), flanked by the mark and the two circular controls,
// needs ~1000px to breathe — and it only fits at 1024 because Notificações
// moved out of the tab row and onto the bell.
export const DESKTOP_WEB_BREAKPOINT = 1024;

/**
 * The centered content column.
 *
 * It was 960 while every desktop screen was a single column of rows. The
 * profile page broke that: it runs a main column beside a fixed 300px rail
 * that starts at the very top of the page, and at 960 the two columns fought
 * for the same space — the cover ended up stubbier than it was designed and
 * the score blocks squeezed.
 *
 * 1240 is the width the profile was designed at, and the whole app moved with
 * it so no screen is an exception. Screens that read worse wide should cap
 * their own measure locally rather than shrink this back.
 *
 * The bar itself is full-bleed and unaffected: its cluster centres on the
 * VIEWPORT, not on this column.
 */
export const DESKTOP_CONTENT_MAX_WIDTH = 1240;

export function useIsDesktopWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= DESKTOP_WEB_BREAKPOINT;
}
