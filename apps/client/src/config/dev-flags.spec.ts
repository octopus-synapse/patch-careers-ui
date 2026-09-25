import { afterEach, describe, expect, it, vi } from "vitest";
import { devTestCardDetails, isDevTestFillEnabled } from "./dev-flags";

describe("isDevTestFillEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is false when the env flag is unset", () => {
    vi.stubGlobal("__DEV__", true);
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_FILL", "");
    expect(isDevTestFillEnabled()).toBe(false);
  });

  it("is false in a release build even when the flag is set (prod-safety)", () => {
    vi.stubGlobal("__DEV__", false);
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_FILL", "true");
    expect(isDevTestFillEnabled()).toBe(false);
  });

  it("is true only in dev with the flag explicitly 'true'", () => {
    vi.stubGlobal("__DEV__", true);
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_FILL", "true");
    expect(isDevTestFillEnabled()).toBe(true);
  });
});

describe("devTestCardDetails", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the documented approved-payment test card by default", () => {
    for (const key of [
      "EXPO_PUBLIC_DEV_TEST_CARD_NUMBER",
      "EXPO_PUBLIC_DEV_TEST_CARD_EXPIRATION",
      "EXPO_PUBLIC_DEV_TEST_CARD_SECURITY_CODE",
      "EXPO_PUBLIC_DEV_TEST_CARDHOLDER_NAME",
      "EXPO_PUBLIC_DEV_TEST_CARDHOLDER_EMAIL",
      "EXPO_PUBLIC_DEV_TEST_CARD_DOCUMENT_TYPE",
      "EXPO_PUBLIC_DEV_TEST_CARD_DOCUMENT_NUMBER",
      "EXPO_PUBLIC_DEV_TEST_CARD_PAYMENT_METHOD_ID",
    ]) {
      vi.stubEnv(key, undefined);
    }
    expect(devTestCardDetails()).toEqual({
      number: "5480832801033311",
      expiration: "11/30",
      securityCode: "123",
      holderName: "APRO",
      holderEmail: "test@testuser.com",
      documentType: "CPF",
      documentNumber: "12345678909",
      paymentMethodId: "master",
    });
  });

  it("allows every test-card field to be overridden from the environment", () => {
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_CARD_NUMBER", "4111111111111111");
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_CARD_EXPIRATION", "12/31");
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_CARD_SECURITY_CODE", "999");
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_CARDHOLDER_NAME", "OTHE");
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_CARDHOLDER_EMAIL", "buyer@example.com");
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_CARD_DOCUMENT_TYPE", "DNI");
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_CARD_DOCUMENT_NUMBER", "987654321");
    vi.stubEnv("EXPO_PUBLIC_DEV_TEST_CARD_PAYMENT_METHOD_ID", "visa");

    expect(devTestCardDetails()).toEqual({
      number: "4111111111111111",
      expiration: "12/31",
      securityCode: "999",
      holderName: "OTHE",
      holderEmail: "buyer@example.com",
      documentType: "DNI",
      documentNumber: "987654321",
      paymentMethodId: "visa",
    });
  });
});
