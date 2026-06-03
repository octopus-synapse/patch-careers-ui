/**
 * Editorial font stacks. The serif is also registered as a Tamagui `serif`
 * family in the app's tamagui.config, but the module owns explicit family
 * strings so every text node renders byte-identically to the original
 * StyleSheet design (Tamagui's `body` family is `"System"`, which is not the
 * same string as `-apple-system`/`system-ui`).
 */

import { Platform } from "react-native";

export const editorialFonts = {
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
  sans: Platform.select({
    ios: "-apple-system",
    android: "sans-serif",
    default: "system-ui",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "ui-monospace",
  }),
} as const;
