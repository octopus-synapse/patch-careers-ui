/**
 * TamaguiProvider wrapper.
 *
 * Theme comes from the persisted color-scheme store (light/dark/system, set in
 * the onboarding theme step or the profile menu); "system" follows
 * `useColorScheme()`. Both the `light` and `dark` themes in
 * `tamagui.config.ts` carry the full standard surface key set — leaving the
 * dark one half-built is what turned inputs black on web last time. The
 * explicit `<Theme>` wrapper guarantees re-theming when the resolved scheme
 * changes at runtime (`defaultTheme` is only read on mount).
 *
 * On web we also mirror the scheme into `document.documentElement` so
 * UA-styled surfaces (native inputs, scrollbars, autofill) follow the app's
 * choice rather than the OS.
 *
 * `forceScheme` still wins so tests/previews can pin a theme explicitly.
 *
 * Kept separate from `_layout.tsx` so screens/tests can import it without
 * pulling Expo Router's root layout machinery.
 */

import { editorialPalettes } from "@patch-careers/tokens";
import { TamaguiProvider, Theme } from "@tamagui/core";
import { type ReactElement, type ReactNode, useEffect } from "react";
import { type ColorSchemeName, Platform } from "react-native";
import config from "../../tamagui.config";
import { useResolvedScheme } from "./color-scheme";

interface Props {
  readonly children: ReactNode;
  readonly forceScheme?: ColorSchemeName;
}

export function AppTamaguiProvider({ children, forceScheme }: Props): ReactElement {
  const resolved = useResolvedScheme();
  const theme = forceScheme === "dark" || forceScheme === "light" ? forceScheme : resolved;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.backgroundColor = editorialPalettes[theme].bg;
  }, [theme]);

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      <Theme name={theme}>{children}</Theme>
    </TamaguiProvider>
  );
}
