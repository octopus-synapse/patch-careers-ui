/**
 * Inter, the app's sans face on web.
 *
 * The type identity is Playfair Display + Inter + JetBrains Mono. Serif and
 * mono are real faces loaded through expo-font at the root; Inter is loaded
 * here instead, as a plain Google Fonts stylesheet, for one reason: expo-font
 * registers each weight under its OWN family name (`Inter_600SemiBold`), which
 * means `fontWeight` can no longer pick a face. A stylesheet gives the browser
 * 400/500/600/700 under the single family `Inter`, so every existing
 * `fontWeight` in the app keeps working untouched.
 *
 * Native therefore keeps the platform system face (see
 * `packages/ui/src/editorial/fonts.ts`): shipping a single Inter face there
 * would flatten every weight in the app to one.
 *
 * Idempotent; a no-op on native and during SSR. Called from the root layout's
 * module scope, next to `ensureWebButtonTextReset`.
 */

import { Platform } from "react-native";

const LINK_ID = "patch-app-inter";
const HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";

export function ensureAppSansFont(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById(LINK_ID)) return;
  const link = document.createElement("link");
  link.id = LINK_ID;
  link.rel = "stylesheet";
  link.href = HREF;
  document.head.appendChild(link);
}
