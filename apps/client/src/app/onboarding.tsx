import { useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { AuthFlowPanel } from "@/components/auth/auth-dialog/auth-flow-panel";
import { ChoosePlanStep } from "@/components/auth/auth-dialog/choose-plan-step";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { OnboardingWizard } from "@/features/onboarding";
import { AppRedirect } from "@/navigation/app-redirect";
import {
  AUTH_ROUTE,
  getCompletedOnboardingRoute,
  VERIFY_EMAIL_ROUTE,
} from "@/navigation/auth-redirect";
import { useAppRouter } from "@/navigation/use-app-router";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export default function OnboardingScreen(): ReactElement | null {
  const { choosePlan } = useLocalSearchParams<{ choosePlan?: string }>();
  const router = useAppRouter();
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();

  if (!hasBootstrapped) return null;
  if (!isAuthenticated) return <AppRedirect href={AUTH_ROUTE} />;
  if (currentUser?.needsEmailVerification) return <AppRedirect href={VERIFY_EMAIL_ROUTE} />;
  if (currentUser?.hasCompletedOnboarding) {
    return <AppRedirect href={getCompletedOnboardingRoute()} />;
  }

  if (choosePlan === "1") {
    return (
      <AuthPageFrame plan>
        <AuthFlowPanel variant="page" isPlanStep>
          <ChoosePlanStep
            onBack={() => router.replace("/onboarding")}
            onContinue={(plan, offerCode) => {
              if (plan === "free") {
                router.replace("/onboarding");
              } else {
                router.replace({
                  pathname: "/go",
                  params: { startCheckout: plan, ...(offerCode ? { offerCode } : {}) },
                });
              }
            }}
          />
        </AuthFlowPanel>
      </AuthPageFrame>
    );
  }

  return <OnboardingWizard />;
}
