/**
 * Profile bottom-tab icon — the user's avatar (photo, with initials fallback)
 * inside a soft border ring instead of a generic person glyph. The ring uses
 * editorial palette tokens so it adapts to light/dark, and turns ink when the
 * tab is focused to signal the active tab. A green presence dot sits at the
 * top-right (decorative for now; `showPresence` lets a real signal drive it
 * later without a refactor). Reuses the same profile query as the header
 * (shared React Query cache — no extra request).
 */
import { useGetV1UsersProfile } from "@patch-careers/api-client";
import { Avatar, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { View } from "react-native";

// Online/presence accent — kept literal (not in the editorial palette, which
// reserves green for success messaging).
// @style-allow color: online presence dot (intentional semantic green, not a surface token)
const PRESENCE_GREEN = "#34D399";
const RING = 1.5; // ring border width
const GAP = 0.5; // gap between ring and avatar photo

/**
 * Sized so the ring's OUTER diameter equals the bottom-tab icon size, keeping
 * the Profile tab visually identical in footprint to the glyph tabs (no taller
 * column → labels stay aligned). The avatar photo fills the inside.
 */
export function ProfileTabIcon({
  focused,
  size = 22,
  showPresence = true,
}: {
  focused: boolean;
  size?: number;
  showPresence?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const profile = useGetV1UsersProfile();
  const photoURL = profile.data?.photoURL ?? undefined;
  const name = profile.data?.name ?? "";

  const avatarSize = size - 2 * (RING + GAP);
  const dot = Math.round(size * 0.42);

  return (
    <YStack position="relative">
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          borderWidth: RING,
          padding: GAP,
          overflow: "hidden",
          borderColor: focused ? palette.ink : palette.hairlineStrong,
          backgroundColor: palette.surface,
        }}
      >
        <Avatar src={photoURL} name={name || "?"} size={avatarSize} />
      </View>
      {showPresence ? (
        <View
          style={{
            position: "absolute",
            top: -1,
            right: -1,
            width: dot,
            height: dot,
            borderRadius: 999,
            borderWidth: 2,
            backgroundColor: PRESENCE_GREEN,
            borderColor: palette.surface,
          }}
        />
      ) : null}
    </YStack>
  );
}
