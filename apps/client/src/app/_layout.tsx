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
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { PortalProvider } from "@tamagui/portal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { type ReactElement, useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavBar } from "@/components/nav-bar/nav-bar";
import { NetInfoBanner } from "@/components/net-info-banner";
import { DESKTOP_CONTENT_MAX_WIDTH, useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { ensureAppSansFont } from "@/lib/app-sans-font";
import { ensureWebButtonTextReset } from "@/lib/web-button-text-reset";
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

// Static fill style for the gesture-handler root — a non-Tamagui host that takes
// a plain `style`, so it lives as a stable module const rather than inline.
const ROOT_FLEX = { flex: 1 };

// Web-only global CSS patch (see the module doc) — before first render so no
// centered-text flash. No-op on native.
ensureWebButtonTextReset();
ensureAppSansFont();

export default function RootLayout(): ReactElement {
  const scheme = useResolvedScheme();
  const palette = editorialPalettes[scheme];
  const isDesktopWeb = useIsDesktopWeb();
  // Editorial display serif + technical mono (bundled assets — no network).
  // editorialFonts maps to these exact family keys.
  const [fontsLoaded] = useFonts({ PlayfairDisplay_500Medium, JetBrainsMono_500Medium });

  // React Navigation paints its own Background behind every scene; on desktop
  // web the scenes are narrower than the window (centered column), so that
  // background shows in the gutters — align it with the editorial paper
  // instead of the stock navigation grey/near-black.
  const navigationTheme = useMemo(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.accent,
        background: palette.bg,
        card: palette.surface,
        text: palette.ink,
        border: palette.hairline,
        notification: palette.danger,
      },
    };
  }, [scheme, palette]);

  // Desktop web reads as a web app: every stack scene becomes a centered
  // column over full-bleed paper. Mobile/native keeps full-width scenes.
  const contentStyle = useMemo(
    () =>
      isDesktopWeb
        ? {
            backgroundColor: palette.bg,
            width: "100%" as const,
            maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
            alignSelf: "center" as const,
          }
        : { backgroundColor: palette.bg },
    [isDesktopWeb, palette],
  );

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
    <GestureHandlerRootView style={ROOT_FLEX}>
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
                        <ThemeProvider value={navigationTheme}>
                          {/* Desktop-web chrome: the app variant of the one top
                            bar. Self-gates to authed desktop-web app screens. */}
                          <NavBar variant="app" />
                          <Stack
                            screenOptions={{
                              headerShown: false,
                              // Paper-colored scene background so push transitions
                              // don't flash white on dark; on desktop web the same
                              // style also centers the scene into the content column.
                              contentStyle,
                            }}
                          >
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            {/* The `/en` tree renders its own Stack with the same
                              column default — the scene wrapper here must stay
                              full-bleed or the whole English subtree (landing
                              included) gets squeezed into the 960px column. */}
                            <Stack.Screen
                              name="en"
                              options={{
                                headerShown: false,
                                contentStyle: {
                                  backgroundColor: palette.bg,
                                  width: "100%",
                                  maxWidth: undefined,
                                  alignSelf: "stretch",
                                },
                              }}
                            />
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
                            {/* Notifications inbox slides in over the tabs from the
                          AppHeader bell. */}
                            <Stack.Screen
                              name="notifications"
                              options={{ headerShown: false, animation: "slide_from_right" }}
                            />
                            {/* Settings slides in over the tabs from the account menu. */}
                            <Stack.Screen
                              name="settings"
                              options={{ headerShown: false, animation: "slide_from_right" }}
                            />
                            {/* Full-bleed like the `en` subtree: onboarding wears the
                              landing's overlay navbar, which is `position: absolute;
                              left: 0; right: 0`. Inside the 960px column those edges
                              are the COLUMN's, so the mark and the hamburger drifted
                              inward instead of sitting against the viewport. The
                              wizard centres its own 460px column regardless. */}
                            <Stack.Screen
                              name="onboarding"
                              options={{
                                headerShown: false,
                                contentStyle: {
                                  backgroundColor: palette.bg,
                                  width: "100%",
                                  maxWidth: undefined,
                                  alignSelf: "stretch",
                                },
                              }}
                            />
                            <Stack.Screen
                              name="fit-questionnaire"
                              options={{ headerShown: false, animation: "slide_from_bottom" }}
                            />
                            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
                            <Stack.Screen name="oauth-callback" options={{ headerShown: false }} />
                            <Stack.Screen
                              name="legal-webview"
                              options={{ headerShown: true, title: "" }}
                            />
                          </Stack>
                        </ThemeProvider>
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
