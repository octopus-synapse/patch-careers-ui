/**
 * Shared contract for `PublicNavBar`, in a module with NO platform variants.
 *
 * The `.web.tsx` implementation cannot import values from `./public-nav-bar`:
 * on web that specifier resolves back to the `.web.tsx` file itself, so a
 * runtime import makes the module import itself ("Maximum call stack size
 * exceeded" at load). `import type` got away with it because it is erased.
 * Anything both platforms need at RUNTIME lives here instead.
 */

/** Bar height, so overlaid screens can clear it. */
export const PUBLIC_NAV_BAR_HEIGHT = 76;

/**
 * Which chrome the bar wears. `onboarding` is the signed-in variant: no CTA
 * (the visitor already has an account), the wizard's progress moves into the
 * bar, and the menu swaps its sign-in/sign-up rows for the account section.
 */
export type PublicNavCta = "landing" | "signIn" | "signUp" | "onboarding";

/** Wizard progress, rendered as the bar's own bottom rule. */
export interface PublicNavProgress {
  /** 0-100. */
  readonly pct: number;
  /** Quiet step counter, e.g. "4 / 10". */
  readonly label: string;
}

/** The signed-in account shown inside the menu on the `onboarding` variant. */
export interface PublicNavAccount {
  readonly email: string;
  readonly name?: string | undefined;
}
