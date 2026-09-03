/**
 * `renderApp` — mount a component inside the providers every screen assumes:
 * Tamagui (theme resolved, pinned to a scheme) and i18n (pinned to a locale,
 * so nothing is read from storage). Pinning both is what makes a component
 * test deterministic; the app's own resolution order is tested elsewhere.
 */

import type { Locale } from "@patch-careers/i18n";
import { type RenderOptions, type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { ColorSchemeName } from "react-native";
import { AppTamaguiProvider } from "@/providers/app-tamagui-provider";
import { I18nProvider } from "@/providers/i18n-provider";

interface AppRenderOptions extends Omit<RenderOptions, "wrapper"> {
  locale?: Locale;
  scheme?: ColorSchemeName;
}

export function renderApp(
  ui: ReactElement,
  { locale = "pt-BR", scheme = "light", ...options }: AppRenderOptions = {},
): RenderResult {
  const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <AppTamaguiProvider forceScheme={scheme}>
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </AppTamaguiProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
