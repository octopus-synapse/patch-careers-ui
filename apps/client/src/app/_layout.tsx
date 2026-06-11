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

import { editorialPalettes } from "@patch-careers/tokens";
import { ToastProvider } from "@patch-careers/ui";
import { PortalProvider } from "@tamagui/portal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { type ReactElement, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NetInfoBanner } from "@/components/net-info-banner";
import { AppTamaguiProvider } from "@/providers/app-tamagui-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { useColorSchemeStore, useResolvedScheme } from "@/providers/color-scheme";
import { I18nProvider } from "@/providers/i18n-provider";

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
  const scheme = useResolvedScheme();
  const palette = editorialPalettes[scheme];

  useEffect(() => {
    // Hold the splash until the persisted color scheme hydrates, so an
    // explicit "dark" choice doesn't flash a light first frame (with a
    // timeout fallback in case storage never resolves).
    const hide = () => void SplashScreen.hideAsync().catch(() => undefined);
    if (useColorSchemeStore.persist.hasHydrated()) {
      hide();
      return;
    }
    const unsubscribe = useColorSchemeStore.persist.onFinishHydration(hide);
    const fallback = setTimeout(hide, 500);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  return (
    // Required once at the root for react-native-gesture-handler (swipe-to-
    // delete rows in the resume section manager).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <AppTamaguiProvider>
              <PortalProvider shouldAddRootHost>
                <ToastProvider>
                  <I18nProvider>
                    <AuthProvider>
                      {/* Follow the in-app choice, not the OS ("auto" tracks the OS). */}
                      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
                      <NetInfoBanner />
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          // Paper-colored scene background so push transitions
                          // don't flash white on dark.
                          contentStyle: { backgroundColor: palette.bg },
                        }}
                      >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        {/* Messages is a standalone screen (no tab bar, no AppHeader)
                          that slides in over the tabs from the header's chat icon. */}
                        <Stack.Screen
                          name="messages"
                          options={{ headerShown: false, animation: "slide_from_right" }}
                        />
                        <Stack.Screen
                          name="conversation/[id]"
                          options={{ headerShown: false, animation: "slide_from_right" }}
                        />
                        {/* Job detail pushes over the tabs from a list card. */}
                        <Stack.Screen
                          name="job/[id]"
                          options={{ headerShown: false, animation: "slide_from_right" }}
                        />
                        {/* Resume detail pushes over the tabs from the Currículos sub-tab. */}
                        <Stack.Screen
                          name="resume/[id]"
                          options={{ headerShown: false, animation: "slide_from_right" }}
                        />
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
    </GestureHandlerRootView>
  );
}
