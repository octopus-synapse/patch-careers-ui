import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { FitQuestionnaireScreen } from "@/features/fit";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export default function FitQuestionnaireRoute(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { isAuthenticated } = useAuthState();

  if (!hasBootstrapped) return null;
  if (!isAuthenticated) return <Redirect href={AUTH_SIGN_IN_ROUTE} />;

  return <FitQuestionnaireScreen />;
}
