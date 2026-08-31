/**
 * The landing's sans face.
 *
 * The prototype (`landing-demo-v15.html`) sets the whole page in Inter; the
 * app's editorial `sans` is deliberately the platform system face (see
 * `packages/ui/src/editorial/fonts.ts`). The landing is the one surface whose
 * art direction is pinned to the prototype, so it loads Inter on web — as a
 * plain Google Fonts stylesheet, which gives the browser real 400/500/600
 * weights under a single family name — and keeps the system face on native.
 */

import { editorialFonts } from "@patch-careers/ui/editorial";
import { Platform } from "react-native";

export const landingSans = Platform.select({
  web: "Inter, system-ui, sans-serif",
  default: editorialFonts.sans,
});

const LINK_ID = "patch-landing-inter";
const HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap";

/** Idempotent; no-op on native and during SSR. */
export function ensureLandingFonts(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById(LINK_ID)) return;
  const link = document.createElement("link");
  link.id = LINK_ID;
  link.rel = "stylesheet";
  link.href = HREF;
  document.head.appendChild(link);
}
