import { Stack } from "expo-router";
import type { ReactElement } from "react";

/** Nested stack so all settings sub-screens share standalone chrome (each
 *  screen owns its own back bar via SettingsScreenShell). */
export default function SettingsLayout(): ReactElement {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
