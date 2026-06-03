import { type OAuthProvider, signInWithProviderNative } from "@patch-careers/auth";
import { useToast } from "@patch-careers/ui";
import { useCallback } from "react";
import { OAUTH_CALLBACK_URL, resolveApiBaseURL } from "../../../config/api";
import { useTranslator } from "../../../providers/I18nProvider";

/**
 * Drives a native OAuth sign-in: resolves the API base URL, launches the
 * provider flow against the shared `OAUTH_CALLBACK_URL`, and surfaces a
 * danger toast on failure. The deep-link callback is handled by
 * `AuthProvider`, which forwards it to `completeOAuth`.
 */
export function useOAuthSignIn(): {
  handleOAuth: (provider: OAuthProvider) => Promise<void>;
} {
  const t = useTranslator();
  const toast = useToast();

  const handleOAuth = useCallback(
    async (provider: OAuthProvider) => {
      try {
        const result = await signInWithProviderNative(provider, {
          apiBaseURL: resolveApiBaseURL(),
          redirectUri: OAUTH_CALLBACK_URL,
        });
        if (!result.ok) toast.show({ title: t("auth.oauthFailed"), intent: "danger" });
      } catch {
        toast.show({ title: t("auth.oauthFailed"), intent: "danger" });
      }
    },
    [t, toast],
  );

  return { handleOAuth };
}
