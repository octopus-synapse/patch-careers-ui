import { AppRedirect } from "@/navigation/app-redirect";
/**
 * Layout for the unauthenticated `(auth)` group. Centers a single
 * Stack so each screen can render its own card. We don't show a header
 * here — screens supply their own back affordance when needed.
 *
 * Already-authenticated users are bounced to the tabbed shell so the
 * auth flow never appears post-login (e.g. when they hit the back
 * button after creating an account → verify-email).
 */

import { Stack, usePathname } from "expo-router";
import type { ReactElement } from "react";
import { NavBar } from "@/components/nav-bar/nav-bar";
import { getAuthenticatedRoute, VERIFY_EMAIL_ROUTE } from "@/navigation/auth-redirect";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export default function AuthLayout(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();
  const pathname = usePathname();
  const localized = useLocalizedHref();

  if (!hasBootstrapped) return null;
  if (isAuthenticated && currentUser?.needsEmailVerification) {
    if (pathname.includes("verify-email")) {
      return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
    }
    return <AppRedirect href={localized(VERIFY_EMAIL_ROUTE)} />;
  }
  if (isAuthenticated) return <AppRedirect href={getAuthenticatedRoute(currentUser)} />;

  // The navbar rides over the auth page only (web; the native stub renders
  // null). Deeper flow screens (forgot-password, verify-email, 2fa) stay
  // chromeless — they own the full window. The auth bar has no CTA
  // pointing back to the current page.
  const bare = pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  const showNav = bare === "/auth";

  return (
    <>
      {showNav && <NavBar variant="auth" />}
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </>
  );
}
