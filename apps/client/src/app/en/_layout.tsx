/**
 * Layout for the `/en` tree — the public pages in English, at addresses
 * that say so. Pins the i18n provider to `en` so every screen below
 * (landing, auth, reset-password) renders English regardless of the
 * browser or the saved preference, without persisting anything: only
 * the explicit UI (onboarding "Idioma", settings) writes the choice.
 *
 * Renders its own Stack with the shared scene `contentStyle` so the
 * `/en` twins get the same desktop content column as their unprefixed
 * siblings — and so the landing's full-bleed `Stack.Screen` opt-out
 * targets THIS stack, exactly as it targets the root stack at `/`.
 * (The root layout marks the `en` scene itself full-bleed.)
 */

import { Stack } from "expo-router";
import type { ReactElement } from "react";
import { useSceneContentStyle } from "@/hooks/use-scene-content-style";
import { I18nProvider } from "@/providers/i18n-provider";

export default function EnglishLayout(): ReactElement {
  const contentStyle = useSceneContentStyle();
  return (
    <I18nProvider locale="en">
      <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle }} />
    </I18nProvider>
  );
}
