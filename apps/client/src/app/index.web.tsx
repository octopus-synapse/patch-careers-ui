/**
 * `/` on web — the public landing page.
 *
 * This file exists only for web: Metro resolves the `.web` extension ahead of
 * `index.tsx`, so iOS and Android keep the plain redirect and never bundle a
 * byte of the marketing page (verified against the exported Hermes bytecode).
 *
 * Signed-in visitors are still sent into the app, exactly as `index.tsx` does —
 * the landing is the *unauthenticated* front door, not a screen you can get
 * stuck on with a session.
 */

import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { NavBar } from "@/components/nav-bar/nav-bar";
import { LandingHead, LandingScreen } from "@/features/landing";
import { getAuthenticatedRoute } from "@/navigation/auth-redirect";
import { useEnglishTwinRedirect } from "@/navigation/locale-prefix";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export default function Index(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();
  const englishTwin = useEnglishTwinRedirect();

  // Hold the frame while the session resolves, so a signed-in reload
  // doesn't flash the marketing page before redirecting.
  if (!hasBootstrapped) return null;
  if (isAuthenticated) return <Redirect href={getAuthenticatedRoute(currentUser)} />;
  // The address mirrors the language: `/` is the pt-BR canonical, the
  // English landing lives at `/en` (browser language or saved choice).
  if (englishTwin) return <Redirect href={englishTwin} />;
  return (
    <>
      <LandingHead />
      <LandingScreen header={<NavBar variant="landing" />} />
    </>
  );
}
