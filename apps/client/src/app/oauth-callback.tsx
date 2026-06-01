/**
 * OAuth callback (D106) — the deep link `patchcareers://auth/callback`
 * also resolves to this screen when the system delivers it via
 * `Linking.openURL` instead of the live subscription. We parse the
 * tokens out of the URL, persist them, and bootstrap.
 *
 * In the happy path the AuthProvider's `Linking.addEventListener`
 * already handled the URL — this screen is a fallback for cold-start
 * navigation and a place to show a spinner while completion finishes.
 */

import { bootstrap, completeOAuth } from "@patch-careers/auth";
import { secure } from "@patch-careers/storage";
import { palette } from "@patch-careers/tokens";
import { Text, useToast, YStack } from "@patch-careers/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { resolveApiBaseURL } from "../config/api";
import { getCurrentAuthenticatedRoute } from "../navigation/authRedirect";
import { useTranslator } from "../providers/I18nProvider";

export default function OAuthCallbackScreen(): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  const toast = useToast();
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
      const reconstructed = `patchcareers://auth/callback?${usp.toString()}`;
      const pair = await completeOAuth(reconstructed, secure, apiBaseURL).catch(() => null);
      if (cancelled) return;
      if (pair) {
        await bootstrap().catch(() => undefined);
        router.replace(getCurrentAuthenticatedRoute());
      } else {
        toast.show({ title: t("auth.oauthFailed"), intent: "danger" });
        router.replace("/(auth)/sign-in");
      }
    }
    void finish();
    return () => {
      cancelled = true;
    };
  }, [params.accessToken, params.refreshToken, params.expiresIn, router, toast, t]);

  return (
    <View style={styles.root}>
      <YStack alignItems="center" gap={16}>
        <ActivityIndicator size="large" color={palette.blue[600]} />
        <Text preset="body" color="$gray10">
          {t("auth.oauthFinishing")}
        </Text>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.gray[50],
  },
});
