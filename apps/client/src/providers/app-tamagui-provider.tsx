/**
 * TamaguiProvider wrapper.
 *
 * Theme is pinned to `light` for now. Dark mode isn't implemented yet — the
 * `dark` theme in `tamagui.config.ts` is incomplete (missing the standard
 * Tamagui surface keys built-in components read), and the Editorial Calm
 * auth/onboarding flows are light-only by design. Following the system color
 * scheme into that half-built theme is exactly what turned inputs black on
 * web (browsers reporting dark mode) while mobile (light) looked fine.
 *
 * `forceScheme` still wins so tests/previews can exercise `dark` explicitly;
 * once a real dark theme lands we restore `useColorScheme()` here.
 *
 * Kept separate from `_layout.tsx` so screens/tests can import it without
 * pulling Expo Router's root layout machinery.
 */

import { TamaguiProvider } from "@tamagui/core";
import type { ReactElement, ReactNode } from "react";
import type { ColorSchemeName } from "react-native";
import config from "../../tamagui.config";

interface Props {
  readonly children: ReactNode;
  readonly forceScheme?: ColorSchemeName;
}

export function AppTamaguiProvider({ children, forceScheme }: Props): ReactElement {
  const theme = forceScheme === "dark" ? "dark" : "light";

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      {children}
    </TamaguiProvider>
  );
}
