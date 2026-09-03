/**
 * Public profile route — `/u/<username>`, the canonical shape of the link the
 * profile rail copies (`lib/public-profile-url.ts`). `/en/u/<username>` is the
 * same file re-exported under the English tree.
 *
 * Deliberately outside `(tabs)`: it must render for a signed-out visitor, so it
 * cannot sit behind the tab group's auth gate. The screen mounts its own
 * landing bar when there is no session and leaves the root layout's app bar
 * alone when there is.
 *
 * The full-bleed opt-out lives HERE, not in the parent stack's registration,
 * so both trees get it: the `/en` layout renders its own Stack with the
 * desktop column as the default, and a `Stack.Screen` inside the route is the
 * one thing that reaches whichever stack is rendering it (the landing does the
 * same). Inside the column a visitor with no app around would see a 1240px
 * card floating on paper.
 */

import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Stack, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { PublicProfileScreen } from "@/features/public-profile";

export default function PublicProfileRoute(): ReactElement {
  const palette = useEditorialPalette();
  const params = useLocalSearchParams<{ username: string }>();
  const raw = Array.isArray(params.username) ? params.username[0] : params.username;
  const username = raw?.trim();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          contentStyle: {
            backgroundColor: palette.bg,
            width: "100%",
            maxWidth: undefined,
            alignSelf: "stretch",
          },
        }}
      />
      {/* `@maria` and `maria` are the same person; the API takes the bare handle. */}
      <PublicProfileScreen username={username ? username.replace(/^@/, "") : undefined} />
    </>
  );
}
