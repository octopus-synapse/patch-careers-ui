/**
 * `/en` on web — the landing page in English, at an address that says so.
 *
 * Same auth gate as `index.web.tsx` (signed-in visitors go straight into
 * the app), but the URL pins the locale: a nested `I18nProvider` renders
 * the landing in English regardless of browser or persisted preference.
 * Deliberately does NOT call `setLocale` — opening a shared link must not
 * silently rewrite the visitor's saved choice; only the explicit UI
 * (onboarding "Idioma", settings) persists.
 *
 * `/` redirects here when the resolved locale is English, so the address
 * always matches the language on screen.
 */

import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { LandingHead, LandingScreen } from "@/features/landing";
import { getAuthenticatedRoute } from "@/navigation/auth-redirect";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { I18nProvider } from "@/providers/i18n-provider";

export default function EnglishIndex(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();

  if (!hasBootstrapped) return null;
  if (isAuthenticated) return <Redirect href={getAuthenticatedRoute(currentUser)} />;
  return (
    <I18nProvider locale="en">
      <LandingHead />
      <LandingScreen />
    </I18nProvider>
  );
}
