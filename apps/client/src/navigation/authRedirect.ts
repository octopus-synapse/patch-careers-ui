import { type User, useAuthStore } from "@patch-careers/auth";
import type { Href } from "expo-router";

export const AUTH_SIGN_IN_ROUTE = "/(auth)/sign-in" as const;
export const VERIFY_EMAIL_ROUTE = "/(auth)/verify-email" as const;
export const COMPLETED_ONBOARDING_ROUTE = "/(tabs)/profile" as const;
export const DEFAULT_APP_ROUTE = "/(tabs)/jobs" as const;
export const ONBOARDING_ROUTE = "/onboarding" as Href;

export type AuthenticatedRoute =
  | typeof VERIFY_EMAIL_ROUTE
  | typeof COMPLETED_ONBOARDING_ROUTE
  | typeof DEFAULT_APP_ROUTE
  | typeof ONBOARDING_ROUTE;

export function getAuthenticatedRoute(user: User | null): AuthenticatedRoute {
  if (user?.needsEmailVerification) return VERIFY_EMAIL_ROUTE;
  if (user && !user.isAdmin && !user.hasCompletedOnboarding) return ONBOARDING_ROUTE;
  return DEFAULT_APP_ROUTE;
}

export function getCompletedOnboardingRoute(): typeof COMPLETED_ONBOARDING_ROUTE {
  return COMPLETED_ONBOARDING_ROUTE;
}

export function getCurrentAuthenticatedRoute(): AuthenticatedRoute {
  return getAuthenticatedRoute(useAuthStore.getState().currentUser);
}
