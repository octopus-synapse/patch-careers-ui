/**
 * Layout for the `/en` tree — the public pages in English, at addresses
 * that say so. Pins the i18n provider to `en` so every screen below
 * (landing, auth, reset-password) renders English regardless of the
 * browser or the saved preference, without persisting anything: only
 * the explicit UI (onboarding "Idioma", settings) writes the choice.
 */

import { Slot } from "expo-router";
import type { ReactElement } from "react";
import { I18nProvider } from "@/providers/i18n-provider";

export default function EnglishLayout(): ReactElement {
  return (
    <I18nProvider locale="en">
      <Slot />
    </I18nProvider>
  );
}
