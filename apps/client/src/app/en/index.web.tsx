/**
 * `/en` on web — the landing page in English. The `en/_layout` pins the
 * locale; this screen only keeps the same auth gate as `index.web.tsx`
 * (signed-in visitors go straight into the app).
 */

import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { PublicNavBar } from "@/components/public-nav-bar";
import { LandingHead, LandingScreen } from "@/features/landing";
import { getAuthenticatedRoute } from "@/navigation/auth-redirect";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export default function EnglishIndex(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();

  if (!hasBootstrapped) return null;
  if (isAuthenticated) return <Redirect href={getAuthenticatedRoute(currentUser)} />;
  return (
    <>
      <LandingHead />
      <LandingScreen header={<PublicNavBar cta="landing" />} />
    </>
  );
}
