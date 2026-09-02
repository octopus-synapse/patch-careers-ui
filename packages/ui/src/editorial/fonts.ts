/**
 * Editorial font stacks — the "Quiet Editorial" type identity: Playfair
 * Display, Inter, JetBrains Mono.
 *
 * `serif` (Playfair Display) and `mono` (JetBrains Mono) are real faces loaded
 * once at the app root via expo-font / @expo-google-fonts; the family string
 * here MUST match the key passed to `useFonts` there. They render at a single
 * weight by design (RN custom fonts don't switch weight via `fontWeight`), so
 * display serif and tabular mono stay visually consistent.
 *
 * `sans` is Inter on web, loaded as a stylesheet by `ensureAppSansFont()` so
 * the browser gets 400/500/600/700 under ONE family and `fontWeight` keeps
 * working everywhere. Native stays on the platform system face: expo-font
 * would register each Inter weight under its own family name, which would
 * flatten the whole UI to a single weight. The system face is weight-aware and
 * already Apple/Google-grade, so nothing is lost there but the letterforms.
 */

import { Platform } from "react-native";

export const editorialFonts = {
  serif: "PlayfairDisplay_500Medium",
  sans: Platform.select({
    web: "Inter, system-ui, sans-serif",
    ios: "-apple-system",
    android: "sans-serif",
    default: "system-ui",
  }),
  mono: "JetBrainsMono_500Medium",
} as const;
