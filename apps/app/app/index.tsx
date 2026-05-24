/**
 * Root index — Expo Router needs a screen at `app/index.tsx` to handle
 * the literal `/` route. We gate on the auth-bootstrap result: while
 * tokens are being validated against `/v1/auth/session`, render nothing
 * (the splash screen is still up); once we know, send the user to
 * either the tabbed shell or the sign-in screen.
 */

import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { useAuthBootstrap, useAuthState } from "../providers/AuthProvider";

export default function Index(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { isAuthenticated } = useAuthState();

  // Wait for the first bootstrap before deciding — avoids a flash of
  // the sign-in screen while we resolve a freshly-restored session.
  if (!hasBootstrapped) return null;
  return isAuthenticated ? <Redirect href="/(tabs)/jobs" /> : <Redirect href="/(auth)/sign-in" />;
}
