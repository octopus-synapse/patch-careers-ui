/**
 * Layout for the unauthenticated `(auth)` group. Centers a single
 * Stack so each screen can render its own card. We don't show a header
 * here — screens supply their own back affordance when needed.
 *
 * Already-authenticated users are bounced to the tabbed shell so the
 * auth flow never appears post-login (e.g. when they hit the back
 * button after sign-up → verify-email).
 */

import { Redirect, Stack, usePathname } from "expo-router";
import type { ReactElement } from "react";
import { NavBar } from "@/components/nav-bar/nav-bar";
import { getAuthenticatedRoute, VERIFY_EMAIL_ROUTE } from "@/navigation/auth-redirect";
import { useEnglishTwinRedirect, useLocalizedHref } from "@/navigation/locale-prefix";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export default function AuthLayout(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();
  const pathname = usePathname();
  const englishTwin = useEnglishTwinRedirect();
  const localized = useLocalizedHref();

  if (!hasBootstrapped) return null;
  // Web: the address mirrors the language. Flows anywhere in the app can
  // keep sending users to the unprefixed auth routes — this bounce puts
  // English visitors on the `/en` twin (query string preserved).
  if (englishTwin) return <Redirect href={englishTwin} />;
  if (isAuthenticated && currentUser?.needsEmailVerification) {
    if (pathname.includes("verify-email")) {
      return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
    }
    return <Redirect href={localized(VERIFY_EMAIL_ROUTE)} />;
  }
  if (isAuthenticated) return <Redirect href={getAuthenticatedRoute(currentUser)} />;

  // The navbar rides over sign-in/sign-up only (web; the native stub renders
  // null). Deeper flow screens (forgot-password, verify-email, 2fa) stay
  // chromeless — they own the full window. Both pages get the SAME bar: no
  // CTA, since a button pointing at the page you are already on is furniture.
  const bare = pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  const showNav = bare.startsWith("/sign-in") || bare.startsWith("/sign-up");

  return (
    <>
      {showNav && <NavBar variant="auth" />}
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </>
  );
}
