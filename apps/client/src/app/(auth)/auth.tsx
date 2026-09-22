import { useLocalSearchParams } from "expo-router";
import { type ReactElement, useState } from "react";
import { AuthFlowCard } from "@/components/auth/auth-dialog/auth-flow-card";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";

export default function AuthScreen(): ReactElement {
  const { step } = useLocalSearchParams<{ step?: string }>();
  const [isPlanStep, setIsPlanStep] = useState(false);
  return (
    <AuthPageFrame plan={isPlanStep} showHeader>
      <AuthFlowCard
        variant="page"
        initialStep={step === "forgot-password" ? "forgotPassword" : "email"}
        onPlanStepChange={setIsPlanStep}
      />
    </AuthPageFrame>
  );
}
