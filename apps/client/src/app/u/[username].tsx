/**
 * Public profile route — `/u/<username>`, the canonical shape of the link the
 * profile rail copies (`lib/public-profile-url.ts`).
 *
 * Deliberately outside `(tabs)`: it must render for a signed-out visitor, so it
 * cannot sit behind the tab group's auth gate. The screen mounts its own
 * landing bar when there is no session and leaves the root layout's app bar
 * alone when there is.
 */

import { useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { PublicProfileScreen } from "@/features/public-profile";

export default function PublicProfileRoute(): ReactElement {
  const params = useLocalSearchParams<{ username: string }>();
  const raw = Array.isArray(params.username) ? params.username[0] : params.username;
  const username = raw?.trim();
  // `@maria` and `maria` are the same person; the API takes the bare handle.
  return <PublicProfileScreen username={username ? username.replace(/^@/, "") : undefined} />;
}
