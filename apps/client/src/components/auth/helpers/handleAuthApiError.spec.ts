import type { Locale, Translator } from "@patch-careers/i18n";
import { describe, expect, it, vi } from "vitest";
import { handleAuthApiError } from "./handleAuthApiError";

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

  it("surfaces inline field errors when the backend returns field details", () => {
    const show = vi.fn();
    const setFieldErrors = vi.fn();
    const err = {
      response: { data: { fields: [{ path: "email", message: "Email already in use" }] } },
    };

    handleAuthApiError(err, {
      locale,
      t,
      toast: { show },
      setFieldErrors,
      fallbackKey: "auth.signupFailed",
      payload: { email: "a@b.com", password: "secret" },
    });

    expect(setFieldErrors).toHaveBeenCalledWith({ email: "Email already in use" });
    expect(show).toHaveBeenCalledWith({ title: "Email already in use", intent: "danger" });
  });
});
