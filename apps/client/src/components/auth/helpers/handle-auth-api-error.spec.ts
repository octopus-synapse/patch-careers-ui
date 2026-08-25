import { DICTIONARIES } from "@patch-careers/api-client";
import type { Locale, Translator } from "@patch-careers/i18n";
import { describe, expect, it, vi } from "vitest";
import { handleAuthApiError } from "./handle-auth-api-error";

const t = ((key: string) => key) as Translator;
const locale: Locale = "en";

describe("handleAuthApiError", () => {
  it("shows a danger toast and leaves fields untouched for a bare error", () => {
    const show = vi.fn();
    const setFieldErrors = vi.fn();

    handleAuthApiError(new Error("network down"), {
      locale,
      t,
      toast: { show },
      setFieldErrors,
      fallbackKey: "auth.loginFailed",
    });

    expect(show).toHaveBeenCalledWith({ title: "network down", intent: "danger" });
    expect(setFieldErrors).not.toHaveBeenCalled();
  });

  it("renders localized fields[] inline — and does not toast the same sentence", () => {
    const show = vi.fn();
    const setFieldErrors = vi.fn();
    const err = {
      response: {
        data: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          severity: "inline",
          fields: [
            {
              path: ["name"],
              code: "STRING_TOO_SHORT",
              params: { min: 2 },
              message: "Minimum of 2 characters",
            },
            { path: ["email"], code: "EMAIL_INVALID", message: "Enter a valid e-mail" },
          ],
        },
      },
    };

    handleAuthApiError(err, {
      locale,
      t,
      toast: { show },
      setFieldErrors,
      fallbackKey: "auth.signupFailed",
    });

    expect(setFieldErrors).toHaveBeenCalledWith({
      name: "Minimum of 2 characters",
      email: "Enter a valid e-mail",
    });
    expect(show).not.toHaveBeenCalled();
  });

  it("pins a field-shaped top-level code to its input (translated), no toast", () => {
    const show = vi.fn();
    const setFieldErrors = vi.fn();
    const err = {
      response: { data: { code: "EMAIL_IN_USE", message: "This email is already in use" } },
    };

    handleAuthApiError(err, {
      locale,
      t,
      toast: { show },
      setFieldErrors,
      fallbackKey: "auth.signupFailed",
    });

    // Known code → the shipped dictionary wins over the raw server message.
    expect(setFieldErrors).toHaveBeenCalledWith({ email: DICTIONARIES.errors.EMAIL_IN_USE.en });
    expect(show).not.toHaveBeenCalled();
  });
});
