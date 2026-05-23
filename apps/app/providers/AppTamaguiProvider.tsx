/**
 * TamaguiProvider wrapper that resolves the active theme based on the
 * system color scheme (D55 — auto follow system, user override comes
 * in a later PR via `@patch-careers/state` colorScheme store).
 *
 * Kept separate from `_layout.tsx` so screens/tests can import it
 * without pulling Expo Router's root layout machinery.
 */

import { TamaguiProvider } from "@tamagui/core";
import type { ReactElement, ReactNode } from "react";
import { type ColorSchemeName, useColorScheme } from "react-native";
import config from "../tamagui.config";

interface Props {
  readonly children: ReactNode;
  readonly forceScheme?: ColorSchemeName;
}

export function AppTamaguiProvider({ children, forceScheme }: Props): ReactElement {
  const system = useColorScheme();
  const scheme: ColorSchemeName = forceScheme ?? system;
  const theme = scheme === "dark" ? "dark" : "light";

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      {children}
    </TamaguiProvider>
  );
}
