/**
 * Copy to clipboard — native side, via `expo-clipboard`.
 *
 * Metro resolves `clipboard.web.ts` first on web (where the browser API and an
 * `execCommand` fallback live); this file is what iOS and Android get. The
 * native module means a dev-client / EAS rebuild whenever it changes version —
 * it was added once the public-link card reached the mobile profile, where
 * "copy" that always failed would have been a permanent broken button.
 */

import * as Clipboard from "expo-clipboard";

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    return await Clipboard.setStringAsync(text);
  } catch {
    return false;
  }
}
