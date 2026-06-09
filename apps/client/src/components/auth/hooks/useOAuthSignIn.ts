import {
  type OAuthProvider,
  signInWithProviderNative,
  signInWithProviderWeb,
} from "@patch-careers/auth";
import { useToast } from "@patch-careers/ui";
import { useCallback } from "react";
import { Platform } from "react-native";
import { OAUTH_CALLBACK_URL, oauthWebCallbackUrl, resolveApiBaseURL } from "@/config/api";
import { useTranslator } from "@/providers/i18n-provider";

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
        if (Platform.OS === "web") {
          // Full-page redirect to the backend OAuth start. On return the
          // backend has set a persistent session cookie and 302s to
          // oauthWebCallbackUrl() — the page navigates away here.
          signInWithProviderWeb(provider, {
            apiBaseURL: resolveApiBaseURL(),
            redirectUri: oauthWebCallbackUrl(),
          });
          return;
        }
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
