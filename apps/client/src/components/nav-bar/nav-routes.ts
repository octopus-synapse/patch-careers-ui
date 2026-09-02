/**
 * Reading "where am I" off the URL.
 *
 * The app bar lives outside the navigators it fronts — it is mounted once in
 * the root layout so it survives tab switches and stacked pushes — so its state
 * comes from `usePathname()`, not from the tab navigator. Both functions here
 * are pure, which is the whole reason they are not inline in the component.
 */

export type NavKey = "jobs" | "messages" | "curriculos" | "notifications" | "profile";

/**
 * Screens that own the full window keep the app bar off; everything else in the
 * signed-in app shows it, tab roots and stacked details alike.
 */
const CHROMELESS_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/verify-email",
  "/2fa-verify",
  "/reset-password",
  "/oauth-callback",
  "/onboarding",
  "/fit-questionnaire",
  "/legal-webview",
] as const;

/** `/en/*` twins mirror their unprefixed siblings for chrome purposes. */
function withoutLocale(pathname: string): string {
  if (pathname === "/en") return "/";
  return pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
}

export function isChromePath(pathname: string): boolean {
  const path = withoutLocale(pathname);
  // The landing owns its own chrome (the public variant of this same bar).
  if (path === "/") return false;
  return !CHROMELESS_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Stacked details keep their section lit — a job detail lights Vagas, a
 * conversation lights Mensagens — mirroring how the web reads "where am I".
 * `notifications` no longer names a tab; it lights the bell instead.
 */
export function activeNavKey(pathname: string): NavKey | null {
  const path = withoutLocale(pathname);
  if (path.startsWith("/jobs") || path.startsWith("/job/")) return "jobs";
  if (path.startsWith("/messages") || path.startsWith("/conversation")) return "messages";
  if (path.startsWith("/curriculos") || path.startsWith("/resume")) return "curriculos";
  if (path.startsWith("/notifications")) return "notifications";
  if (path.startsWith("/profile")) return "profile";
  return null;
}
