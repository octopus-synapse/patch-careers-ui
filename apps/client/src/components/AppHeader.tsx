/**
 * AppHeader — the global top app bar for the authed tab stack.
 *
 * Three anchors, mobile-first: the user's rounded avatar on the left
 * (→ Profile), the global search bar centered, and the Messages
 * quick-action on the right (→ the inbox) carrying the live unread badge.
 *
 * Rendered as the react-navigation `header` for every tab so it stays put
 * while the bottom tab bar switches screens; it owns the top safe-area
 * inset itself (custom headers aren't inset automatically). The avatar
 * photo comes from `GET /v1/users/profile`; `<Avatar>` falls back to the
 * name's initials until a photo exists.
 */

import { Ionicons } from "@expo/vector-icons";
import { useGetV1ChatUnread, useGetV1UsersProfile } from "@patch-careers/api-client";
import { editorialPalette } from "@patch-careers/tokens";
import { Avatar, Text, XStack } from "@patch-careers/ui";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthState } from "../providers/AuthProvider";
import { GlobalSearchBar } from "./GlobalSearchBar";

// Matched left/right column widths keep the centered search bar optically
// centered regardless of avatar vs. icon width.
const EDGE = 44;
// Header content row height (excludes the top safe-area inset). The search
// panel anchors just below this.
const BAR_HEIGHT = 56;

export function AppHeader(): ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuthState();

  const profile = useGetV1UsersProfile({ query: { enabled: isAuthenticated } });
  const photoURL = profile.data?.photoURL ?? undefined;
  const name = profile.data?.name ?? currentUser?.name ?? currentUser?.email ?? "Você";

  // Unread badge on the Messages action. Polls so the count stays roughly
  // live without a socket; React Query dedupes this against any other caller.
  const unread = useGetV1ChatUnread({
    query: { enabled: isAuthenticated, refetchInterval: 30_000 },
  });
  const totalUnread = unread.data?.totalUnread ?? 0;
  const unreadBadge = totalUnread > 99 ? "99+" : String(totalUnread);

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: editorialPalette.surface,
        borderBottomWidth: 1,
        borderBottomColor: editorialPalette.hairline,
      }}
    >
      <XStack alignItems="center" height={BAR_HEIGHT} paddingHorizontal={16}>
        {/* Left — rounded avatar → Profile */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir seu perfil"
          onPress={() => router.push("/profile")}
          hitSlop={8}
          style={{ width: EDGE, alignItems: "flex-start" }}
        >
          <Avatar src={photoURL} name={name} size="md" />
        </Pressable>

        {/* Center — global search */}
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <GlobalSearchBar headerHeight={BAR_HEIGHT} />
        </View>

        {/* Right — Messages quick action → inbox */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={totalUnread > 0 ? `Mensagens, ${totalUnread} não lidas` : "Mensagens"}
          onPress={() => router.push("/messages")}
          hitSlop={8}
          style={{ width: EDGE, alignItems: "flex-end" }}
        >
          <View>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={editorialPalette.ink} />
            {totalUnread > 0 ? (
              <View
                style={{
                  position: "absolute",
                  top: -5,
                  right: -6,
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 3,
                  borderRadius: 8,
                  backgroundColor: editorialPalette.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text color="white" fontSize={10} lineHeight={12} fontWeight="700">
                  {unreadBadge}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </XStack>
    </View>
  );
}
