/**
 * Copy to clipboard — native side.
 *
 * The only surface that copies is the desktop profile's public-link card, so
 * this is a stub rather than a reason to add `expo-clipboard`: that package is
 * a native module, and pulling one in for a web-only affordance would cost a
 * new dev-client and EAS build for nothing.
 *
 * Metro resolves `clipboard.web.ts` first on web, which is where the real
 * implementation lives.
 */

export async function copyToClipboard(_text: string): Promise<boolean> {
  return false;
}
