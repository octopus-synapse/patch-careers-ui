/**
 * Root layout for the Expo Router universal app.
 *
 * Provider order is intentional (outermost → innermost):
 *
 *   SafeAreaProvider
 *   └── QueryClientProvider (TanStack)
 *       └── AppTamaguiProvider (resolves theme from useColorScheme)
 *           └── ToastProvider (Tamagui toast portal — wraps the stack so
 *               useToast() works from any screen, including the auth
 *               flows mounted under `(auth)`)
 *               └── I18nProvider (resolves locale from system)
 *                   └── AuthProvider (token bootstrap + OAuth callback)
 *                       ├── NetInfoBanner (sticky)
 *                       └── <Stack /> (Expo Router)
 *
 * `SplashScreen.preventAutoHideAsync()` keeps the brand splash visible
 * until the providers have mounted; we hide it on first render of the
 * root stack.
 */

import { ToastProvider } from "@patch-careers/ui";
import { PortalProvider } from "@tamagui/portal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { type ReactElement, useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NetInfoBanner } from "../components/NetInfoBanner";
import { AppTamaguiProvider } from "../providers/AppTamaguiProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { I18nProvider } from "../providers/I18nProvider";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // already hidden / not available on web — non-fatal
});

// Single client instance keeps cache stable across re-renders.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sensible defaults for mobile — refetch when the screen regains
      // focus, but don't hammer the network on every mount.
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function RootLayout(): ReactElement {
  useEffect(() => {
    // Fire-and-forget; if the splash is already hidden the promise
    // rejects harmlessly.
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AppTamaguiProvider>
            <PortalProvider shouldAddRootHost>
              <ToastProvider>
                <I18nProvider>
                  <AuthProvider>
                    <StatusBar style="auto" />
                    <NetInfoBanner />
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
                      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
                      <Stack.Screen name="oauth-callback" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="legal-webview"
                        options={{ headerShown: true, title: "" }}
                      />
                    </Stack>
                  </AuthProvider>
                </I18nProvider>
              </ToastProvider>
            </PortalProvider>
          </AppTamaguiProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
