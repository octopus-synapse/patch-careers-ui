/**
 * `PublicNavBar` — native stub. The public navbar is a WEB addressing
 * concern (landing + auth pages in the browser); the native app keeps
 * its own chrome. The `.web.tsx` sibling holds the real implementation —
 * this pair keeps the landing feature and the menu out of the Hermes
 * bundle by construction.
 *
 * Both platforms take their shared contract from `public-nav-bar.contract`,
 * which has no platform variants (see the note there).
 */

import type { PublicNavAccount, PublicNavCta, PublicNavProgress } from "./public-nav-bar.contract";

export {
  PUBLIC_NAV_BAR_HEIGHT,
  type PublicNavAccount,
  type PublicNavCta,
  type PublicNavProgress,
} from "./public-nav-bar.contract";

export function PublicNavBar(_props: {
  readonly cta: PublicNavCta;
  readonly progress?: PublicNavProgress;
  readonly account?: PublicNavAccount;
}): null {
  return null;
}
