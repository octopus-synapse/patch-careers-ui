import { describe, expect, it, vi } from "vitest";
import { companyLogoUrlFromConfig } from "./company-logo";

vi.mock("expo-constants", () => ({ default: { expoConfig: { extra: {} } } }));

describe("companyLogoUrlFromConfig", () => {
  it("builds the img.logo.dev URL from domain + token", () => {
    expect(companyLogoUrlFromConfig("nubank.com.br", { envToken: "pk_test" })).toBe(
      "https://img.logo.dev/nubank.com.br?token=pk_test&size=64&format=png&retina=true",
    );
  });

  it("prefers the expo extra token and normalizes the domain", () => {
    expect(
      companyLogoUrlFromConfig("  Stripe.COM ", { extraToken: "pk_extra", envToken: "pk_env" }, 32),
    ).toBe("https://img.logo.dev/stripe.com?token=pk_extra&size=32&format=png&retina=true");
  });

  it("returns undefined without a token or domain", () => {
    expect(companyLogoUrlFromConfig("stripe.com", {})).toBeUndefined();
    expect(companyLogoUrlFromConfig("stripe.com", { envToken: "  " })).toBeUndefined();
    expect(companyLogoUrlFromConfig("  ", { envToken: "pk_test" })).toBeUndefined();
  });
});
