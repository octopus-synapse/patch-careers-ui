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

import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { PlayfairDisplay_500Medium, useFonts } from "@expo-google-fonts/playfair-display";
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
import { NotificationsProvider } from "@/providers/notifications-provider";

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
  // Editorial display serif + technical mono (bundled assets — no network).
  // editorialFonts maps to these exact family keys.
  const [fontsLoaded] = useFonts({ PlayfairDisplay_500Medium, JetBrainsMono_500Medium });

  useEffect(() => {
    // Hold the splash until BOTH the persisted color scheme hydrates (so an
    // explicit "dark" choice doesn't flash a light first frame) AND the
    // editorial fonts register (so serif/mono don't flash a fallback face). A
    // timeout backstop hides the splash even if either never resolves.
    const hide = () => void SplashScreen.hideAsync().catch(() => undefined);
    const tryHide = () => {
      if (fontsLoaded && useColorSchemeStore.persist.hasHydrated()) hide();
    };
    tryHide();
    const unsubscribe = useColorSchemeStore.persist.onFinishHydration(tryHide);
    const fallback = setTimeout(hide, 1500);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, [fontsLoaded]);

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
                      <NotificationsProvider>
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
                          <Stack.Screen
                            name="conversation/[id]"
                            options={{ headerShown: false, animation: "slide_from_right" }}
                          />
                          {/* Profile supersection detail screens (Identidade /
                          per-section) slide in over the tabs from the Perfil list. */}
                          <Stack.Screen
                            name="profile/identity"
                            options={{ headerShown: false, animation: "slide_from_right" }}
                          />
                          <Stack.Screen
                            name="profile/section/[key]"
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
                          {/* Settings slides in over the tabs from the account menu. */}
                          <Stack.Screen
                            name="settings"
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
                      </NotificationsProvider>
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
