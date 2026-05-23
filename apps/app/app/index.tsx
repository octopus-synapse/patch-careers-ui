import type { ReactElement } from "react";
/**
 * Root index — Expo Router needs a screen at `app/index.tsx` to handle
 * the literal `/` route. We immediately redirect to the tabbed shell so
 * the bottom tab bar shows up on first boot.
 */

import { Redirect } from "expo-router";

export default function Index(): ReactElement {
  return <Redirect href="/(tabs)/jobs" />;
}
