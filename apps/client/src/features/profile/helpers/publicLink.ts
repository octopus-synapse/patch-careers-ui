/**
 * Public profile link helpers. `expo-clipboard` isn't installed (adding a native
 * dep would force a dev-client rebuild), so web copies via the Clipboard API and
 * native uses React Native's built-in share sheet — no extra dependency.
 */
import { Platform, Share } from "react-native";

export const PROFILE_URL_HOST = "patchcareers.com";

export const buildPublicUrl = (username: string): string =>
  `https://${PROFILE_URL_HOST}/profiles/${username}`;

export type ShareResult = "copied" | "shared" | "failed";

export async function shareProfile(username: string): Promise<ShareResult> {
  const url = buildPublicUrl(username);
  try {
    if (Platform.OS === "web") {
      const nav = (
        globalThis as { navigator?: { clipboard?: { writeText: (t: string) => Promise<void> } } }
      ).navigator;
      if (nav?.clipboard) {
        await nav.clipboard.writeText(url);
        return "copied";
      }
      return "failed";
    }
    await Share.share({ message: url, url });
    return "shared";
  } catch {
    return "failed";
  }
}
