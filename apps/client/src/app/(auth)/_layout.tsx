/**
 * Layout for the unauthenticated `(auth)` group. Centers a single
 * Stack so each screen can render its own card. We don't show a header
 * here — screens supply their own back affordance when needed.
 *
 * Already-authenticated users are bounced to the tabbed shell so the
 * auth flow never appears post-login (e.g. when they hit the back
 * button after sign-up → verify-email).
 */

import { Redirect, Stack } from "expo-router";
import type { ReactElement } from "react";
import { useAuthBootstrap, useAuthState } from "../../providers/AuthProvider";

export default function AuthLayout(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { isAuthenticated } = useAuthState();

  if (!hasBootstrapped) return null;
  if (isAuthenticated) return <Redirect href="/(tabs)/jobs" />;

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
