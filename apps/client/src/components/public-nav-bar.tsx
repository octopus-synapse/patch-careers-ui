/**
 * `PublicNavBar` — native stub. The public navbar is a WEB addressing
 * concern (landing + auth pages in the browser); the native app keeps
 * its own chrome. The `.web.tsx` sibling holds the real implementation —
 * this pair keeps the landing feature and the menu out of the Hermes
 * bundle by construction.
 */

export type PublicNavCta = "landing" | "signIn" | "signUp";

export function PublicNavBar(_props: { readonly cta: PublicNavCta }): null {
  return null;
}
