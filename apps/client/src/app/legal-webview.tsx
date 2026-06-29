/**
 * In-app legal viewer (D98). Renders the Terms of Service or Privacy
 * Policy in a WebView so users never need to leave the app during
 * sign-up to read consent text.
 *
 * Accepts `kind` (terms|privacy) as the canonical param and looks up
 * the public URL from `Constants.expoConfig.extra.legalUrls` so QA can
 * point at the staging copy via app.json. Falls back to production
 * patchcareers.com URLs.
 */

import { YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import Constants from "expo-constants";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, useMemo } from "react";
import { ActivityIndicator, Platform } from "react-native";
import WebView from "react-native-webview";
import { useTranslator } from "@/providers/i18n-provider";

type Kind = "terms" | "privacy";

function resolveLegalUrl(kind: Kind): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    legalUrls?: { terms?: string; privacy?: string };
  };
  const fromConfig = extra.legalUrls?.[kind];
  if (fromConfig) return fromConfig;
  return kind === "terms" ? "https://patchcareers.com/terms" : "https://patchcareers.com/privacy";
}

export default function LegalWebViewScreen(): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  const palette = useEditorialPalette();
  const params = useLocalSearchParams<{ kind?: string; title?: string; url?: string }>();
  const kind: Kind = params.kind === "privacy" ? "privacy" : "terms";
  const title =
    params.title ?? (kind === "privacy" ? t("auth.legalPrivacy") : t("auth.legalTerms"));
  const url = useMemo(() => params.url ?? resolveLegalUrl(kind), [params.url, kind]);

  return (
    <YStack flex={1} backgroundColor={palette.bg}>
      <Stack.Screen
        options={{
          title,
          headerBackTitle: t("common.back"),
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.ink,
        }}
      />
      {Platform.OS === "web" ? (
        // RNW renders WebView as an <iframe>; falling back lets us also
        // use this screen during web dev without polyfills.
        <iframe
          src={url}
          style={{ flex: 1, border: "none", width: "100%", height: "100%" } as unknown as undefined}
          title={title}
        />
      ) : (
        <WebView
          source={{ uri: url }}
          startInLoadingState
          renderLoading={() => (
            <YStack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              alignItems="center"
              justifyContent="center"
              backgroundColor={palette.bg}
            >
              <ActivityIndicator size="large" color={palette.accent} />
            </YStack>
          )}
          onNavigationStateChange={(state) => {
            // Defensive: keep users inside patchcareers.com — outbound
            // links should open in the system browser, not in our WebView.
            if (!state.url.includes("patchcareers.com")) {
              router.back();
            }
          }}
        />
      )}
    </YStack>
  );
}
