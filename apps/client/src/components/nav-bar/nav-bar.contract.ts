/**
 * The web navbar's shape and measurements, in a module with NO platform
 * variants.
 *
 * That matters twice over. `nav-bar.web.tsx` cannot import values from
 * `./nav-bar` — on web that specifier resolves back to the `.web.tsx` file
 * itself, so the module would import itself. And the native stub needs the
 * constants without pulling in a line of DOM code.
 *
 * Two heights on purpose. The app bar carries icon-over-label columns and needs
 * 80 to seat them; the public bar carries a mark and a button, so 76 is already
 * generous — and holding it there keeps the landing's composition and the
 * onboarding wizard's top padding exactly where they are.
 */

export const NAV_BAR_HEIGHT_APP = 80;
export const NAV_BAR_HEIGHT_PUBLIC = 76;

/** Kept under its old name: the onboarding wizard pads its column by it. */
export const PUBLIC_NAV_BAR_HEIGHT = NAV_BAR_HEIGHT_PUBLIC;

/** The circular glass controls (bell, hamburger). */
export const NAV_CONTROL_SIZE = 42;
export const NAV_CONTROL_SIZE_APP = 44;
export const NAV_APP_MAX_WIDTH = 1440;
export const NAV_APP_TIGHT_BREAKPOINT = 1200;
export const NAV_APP_TABS_WIDTH = 420;
export const NAV_APP_TABS_WIDTH_TIGHT = 384;

export const MENU_PANEL_WIDTH = 320;
/**
 * The panel hangs this far below its anchor. Measured from the CONTROL, not
 * from the bar — that is what keeps it correct if either height changes (the
 * old `MENU_TOP = 64` had silently drifted 8px out of step with a 72px bar).
 */
export const MENU_PANEL_OFFSET = 12;

/**
 * Which chrome the bar wears.
 *
 * `app` is the signed-in shell (tabs, search, bell) and self-gates on route +
 * auth + breakpoint; the other three are rendered explicitly by the screen that
 * owns them. `onboarding` is signed in but has no profile yet, so the menu
 * shows the e-mail and the CTA gives way to the wizard's progress.
 */
export type NavBarVariant = "landing" | "auth" | "onboarding" | "app";

/** Wizard progress, rendered as the bar's own middle. */
export interface NavProgress {
  readonly pct: number; // 0-100
  readonly label: string; // e.g. "4 / 10"
}

/** The signed-in account shown inside the menu on the `onboarding` variant. */
export interface NavAccount {
  readonly email: string;
  readonly name?: string | undefined;
}
