/**
 * OAuth callback (D106) — fallback for cold-start delivery of the deep
 * link `patchcareers://auth/callback` (the happy path is handled live by
 * AuthProvider's `Linking` subscription). Parses the tokens, persists
 * them via `completeOAuth`, then bootstraps + routes. Shows a spinner
 * while completion finishes.
 */

import { completeOAuth } from "@patch-careers/auth";
import { secure } from "@patch-careers/storage";
import { editorialPalette } from "@patch-careers/tokens";
import { Text } from "@patch-careers/ui";
import { useLocalSearchParams } from "expo-router";
import { type ReactElement, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { failToSignIn } from "../components/auth/helpers/failToSignIn";
import { useAuthScreen } from "../components/auth/hooks/useAuthScreen";
import { useCompleteAuth } from "../components/auth/hooks/useCompleteAuth";
import { OAUTH_CALLBACK_URL, resolveApiBaseURL } from "../config/api";

export default function OAuthCallbackScreen(): ReactElement {
  const { t, router, toast } = useAuthScreen();
  const { finishAuthentication } = useCompleteAuth();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: string;
  }>();

  useEffect(() => {
    let cancelled = false;
    async function finish() {
      const apiBaseURL = resolveApiBaseURL();
      // Rebuild the callback URL from the params so we can reuse
      // completeOAuth() — it handles cookie / token modes uniformly.
      const usp = new URLSearchParams();
      if (params.accessToken) usp.set("accessToken", params.accessToken);
      if (params.refreshToken) usp.set("refreshToken", params.refreshToken);
      if (params.expiresIn) usp.set("expiresIn", params.expiresIn);
      const reconstructed = `${OAUTH_CALLBACK_URL}?${usp.toString()}`;
      const pair = await completeOAuth(reconstructed, secure, apiBaseURL).catch(() => null);
      if (cancelled) return;
      if (pair) {
        await finishAuthentication();
      } else {
        failToSignIn({ toast, router, t, titleKey: "auth.oauthFailed" });
      }
    }
    void finish();
    return () => {
      cancelled = true;
    };
  }, [
    params.accessToken,
    params.refreshToken,
    params.expiresIn,
    finishAuthentication,
    router,
    toast,
    t,
  ]);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={editorialPalette.ink} />
      <Text preset="body" color="$gray10">
        {t("auth.oauthFinishing")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: editorialPalette.bg,
  },
});
