/**
 * Root layout for the Expo Router universal app.
 *
 * Provider order is intentional (outermost → innermost):
 *
 *   SafeAreaProvider
 *   └── QueryClientProvider (TanStack)
 *       └── AppTamaguiProvider (resolves theme from useColorScheme)
 *           └── I18nProvider (resolves locale from system)
 *               └── AuthProvider (placeholder; real wiring in PR #7)
 *                   ├── NetInfoBanner (sticky)
 *                   └── <Stack /> (Expo Router)
 *
 * `SplashScreen.preventAutoHideAsync()` keeps the brand splash visible
 * until the providers have mounted; we hide it on first render of the
 * root stack.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { type ReactElement, useEffect } from "react";
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
      <QueryClientProvider client={queryClient}>
        <AppTamaguiProvider>
          <I18nProvider>
            <AuthProvider>
              <StatusBar style="auto" />
              <NetInfoBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </AuthProvider>
          </I18nProvider>
        </AppTamaguiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
