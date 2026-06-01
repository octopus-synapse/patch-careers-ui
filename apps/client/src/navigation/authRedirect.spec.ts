import type { User } from "@patch-careers/auth";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_APP_ROUTE,
  getAuthenticatedRoute,
  ONBOARDING_ROUTE,
  VERIFY_EMAIL_ROUTE,
} from "./authRedirect";

const baseUser: User = {
  userId: "u-1",
  email: "user@example.com",
  name: "User",
  username: "user",
  emailVerified: true,
  isAdmin: false,
  hasCompletedOnboarding: false,
  needsEmailVerification: false,
};

describe("getAuthenticatedRoute", () => {
  it("routes users with unverified email into email verification first", () => {
    expect(
      getAuthenticatedRoute({
        ...baseUser,
        emailVerified: false,
        needsEmailVerification: true,
        hasCompletedOnboarding: true,
      }),
    ).toBe(VERIFY_EMAIL_ROUTE);
  });

  it("routes incomplete non-admin users into onboarding", () => {
    expect(getAuthenticatedRoute(baseUser)).toBe(ONBOARDING_ROUTE);
  });

  it("routes completed users into the default app", () => {
    expect(getAuthenticatedRoute({ ...baseUser, hasCompletedOnboarding: true })).toBe(
      DEFAULT_APP_ROUTE,
    );
  });

  it("lets admins bypass onboarding", () => {
    expect(getAuthenticatedRoute({ ...baseUser, isAdmin: true })).toBe(DEFAULT_APP_ROUTE);
  });

  it("falls back to the app route while user hydration catches up", () => {
    expect(getAuthenticatedRoute(null)).toBe(DEFAULT_APP_ROUTE);
  });
});
