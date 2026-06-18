/**
 * Editorial font stacks — the "Quiet Editorial" type identity.
 *
 * `serif` (Playfair Display) and `mono` (JetBrains Mono) are real faces loaded
 * once at the app root via expo-font / @expo-google-fonts; the family string
 * here MUST match the key passed to `useFonts` there. They render at a single
 * weight by design (RN custom fonts don't switch weight via `fontWeight`), so
 * display serif and tabular mono stay visually consistent.
 *
 * `sans` stays the platform SYSTEM face (SF on iOS, Roboto on Android) — it's
 * the UI workhorse used at many weights, and the system face is already
 * Apple-grade and weight-aware, so we avoid a per-weight family refactor.
 */

import { Platform } from "react-native";

export const editorialFonts = {
  serif: "PlayfairDisplay_500Medium",
  sans: Platform.select({
    ios: "-apple-system",
    android: "sans-serif",
    default: "system-ui",
  }),
  mono: "JetBrainsMono_500Medium",
} as const;
