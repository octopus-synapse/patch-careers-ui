/**
 * react-native-web renders `accessibilityRole="button"` Pressables as real
 * `<button>`s but doesn't neutralize the UA's `text-align: center`, so the
 * text inside every tappable list row renders centered on web. `+html.tsx`
 * carries the same one-line rule for static exports; this runtime injection
 * covers the dev server and single-page output, where `+html.tsx` is never
 * rendered.
 */

import { Platform } from "react-native";

const STYLE_ID = "patch-web-button-text-reset";

/** Idempotent; no-op on native and during SSR. */
export function ensureWebButtonTextReset(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = "button { text-align: inherit; }";
  document.head.appendChild(style);
}
