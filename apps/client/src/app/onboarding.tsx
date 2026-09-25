import { useToast } from "@patch-careers/ui";
import { useLocalSearchParams } from "expo-router";
import { type ReactElement, useState } from "react";
import { AuthFlowPanel } from "@/components/auth/auth-dialog/auth-flow-panel";
import { ChoosePlanStep } from "@/components/auth/auth-dialog/choose-plan-step";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { createBillingCheckoutRoute } from "@/features/billing";
import { OnboardingWizard } from "@/features/onboarding";
import { AppRedirect } from "@/navigation/app-redirect";
import {
  AUTH_ROUTE,
  getCompletedOnboardingRoute,
  VERIFY_EMAIL_ROUTE,
} from "@/navigation/auth-redirect";
import { useAppRouter } from "@/navigation/use-app-router";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

export default function OnboardingScreen(): ReactElement | null {
  const { choosePlan } = useLocalSearchParams<{ choosePlan?: string }>();
  const router = useAppRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [openingCheckout, setOpeningCheckout] = useState(false);
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
            submitting={openingCheckout}
            onBack={() => router.replace("/onboarding")}
            onContinue={async (plan, offerCode) => {
              if (plan === "free") {
                router.replace("/onboarding");
                return;
              }
              if (!offerCode) return;
              setOpeningCheckout(true);
              try {
                router.replace(await createBillingCheckoutRoute(offerCode));
              } catch {
                toast.show({ title: t("go.error"), intent: "danger" });
              } finally {
                setOpeningCheckout(false);
              }
            }}
          />
        </AuthFlowPanel>
      </AuthPageFrame>
    );
  }

  return <OnboardingWizard />;
}
