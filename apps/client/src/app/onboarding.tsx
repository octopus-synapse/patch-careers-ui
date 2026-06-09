import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import {
  AUTH_SIGN_IN_ROUTE,
  getCompletedOnboardingRoute,
  VERIFY_EMAIL_ROUTE,
} from "@/navigation/auth-redirect";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export default function OnboardingScreen(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();

  if (!hasBootstrapped) return null;
  if (!isAuthenticated) return <Redirect href={AUTH_SIGN_IN_ROUTE} />;
  if (currentUser?.needsEmailVerification) return <Redirect href={VERIFY_EMAIL_ROUTE} />;
  if (currentUser?.hasCompletedOnboarding) {
    return <Redirect href={getCompletedOnboardingRoute()} />;
  }

  return <OnboardingWizard />;
}
