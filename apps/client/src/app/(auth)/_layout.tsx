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
import { getAuthenticatedRoute, VERIFY_EMAIL_ROUTE } from "@/navigation/authRedirect";
import { useAuthBootstrap, useAuthState } from "@/providers/AuthProvider";

export default function AuthLayout(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();
  const pathname = usePathname();

  if (!hasBootstrapped) return null;
  if (isAuthenticated && currentUser?.needsEmailVerification) {
    if (pathname.includes("verify-email")) {
      return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
    }
    return <Redirect href={VERIFY_EMAIL_ROUTE} />;
  }
  if (isAuthenticated) return <Redirect href={getAuthenticatedRoute(currentUser)} />;

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
