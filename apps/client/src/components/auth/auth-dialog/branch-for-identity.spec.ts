import { describe, expect, it } from "vitest";
import { branchForIdentity } from "./branch-for-identity";

describe("branchForIdentity", () => {
  it("routes an unknown e-mail to sign-up", () => {
    expect(branchForIdentity({ exists: false })).toBe("signUp");
  });

  it("routes a verified password account to sign-in", () => {
    expect(branchForIdentity({ exists: true, emailVerified: true, hasPassword: true })).toBe(
      "signIn",
    );
  });

  it("routes an unverified password account to verification", () => {
    expect(branchForIdentity({ exists: true, emailVerified: false, hasPassword: true })).toBe(
      "resumeUnverified",
    );
  });

  it("routes an unverified social account to verification before setting a password", () => {
    expect(branchForIdentity({ exists: true, emailVerified: false, hasPassword: false })).toBe(
      "resumeUnverified",
    );
  });

  it("routes an account without a password to a neutral notice", () => {
    expect(branchForIdentity({ exists: true, emailVerified: true, hasPassword: false })).toBe(
      "unavailable",
    );
  });

  it("treats missing signals on an existing account as sign-in (never a dead end)", () => {
    expect(branchForIdentity({ exists: true })).toBe("signIn");
  });
});
