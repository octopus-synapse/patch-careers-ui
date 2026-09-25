import { type ReactElement } from "react";
import { OnboardingWizard } from "@/features/onboarding";
import { AppRedirect } from "@/navigation/app-redirect";
import {
  AUTH_ROUTE,
  getCompletedOnboardingRoute,
  VERIFY_EMAIL_ROUTE,
} from "@/navigation/auth-redirect";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export default function OnboardingScreen(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();

  if (!hasBootstrapped) return null;
  if (!isAuthenticated) return <AppRedirect href={AUTH_ROUTE} />;
  if (currentUser?.needsEmailVerification) return <AppRedirect href={VERIFY_EMAIL_ROUTE} />;
  if (currentUser?.hasCompletedOnboarding) {
    return <AppRedirect href={getCompletedOnboardingRoute()} />;
  }

  return <OnboardingWizard />;
}
