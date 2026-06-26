/**
 * AppHeader — the global top app bar for the authed tab stack.
 *
 * Mobile-first: the user's rounded avatar on the left (→ the account menu)
 * and the global search trigger centered (→ the SearchModal command palette).
 * Messages moved to its own bottom tab, so the right side is just a spacer
 * that keeps the search optically centered (and collapses with the avatar).
 *
 * Rendered as the react-navigation `header` for every tab so it stays put
 * while the bottom tab bar switches screens; it owns the top safe-area
 * inset itself (custom headers aren't inset automatically). The avatar
 * photo comes from `GET /v1/users/profile`; `<Avatar>` falls back to the
 * name's initials until a photo exists.
 */

import { useGetV1UsersProfile } from "@patch-careers/api-client";
import { Avatar, XStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchModal, SearchTrigger } from "@/features/search";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { useHeaderCollapsed } from "./header-collapse-store";
import { ProfileMenu } from "./profile-menu";

// Matched left/right column widths keep the centered search bar optically
// centered regardless of avatar vs. icon width.
const EDGE = 44;
// Header content row height (excludes the top safe-area inset).
const BAR_HEIGHT = 56;

export function AppHeader(): ReactElement {
  const { t } = useI18n();
  const editorialPalette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const { currentUser, isAuthenticated } = useAuthState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Collapse-on-scroll (driven by the Vagas screen): when collapsed, the
  // avatar + right spacer slide away and the search trigger takes the full
  // width. `progress` 0 = full, 1 = collapsed.
  const collapsed = useHeaderCollapsed();
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) reduceMotion.current = enabled;
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    Animated.timing(progress, {
      toValue: collapsed ? 1 : 0,
      duration: reduceMotion.current ? 0 : 200,
      useNativeDriver: false,
    }).start();
  }, [collapsed, progress]);
  const sideStyle = {
    width: progress.interpolate({ inputRange: [0, 1], outputRange: [EDGE, 0] }),
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    overflow: "hidden" as const,
  };
  // Collapsed = transparent: the surface + bottom hairline fade out so only the
  // search input remains, floating over the screen background.
  const surfaceOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  // When collapsed (search-only) and idle, the search bar rests at a slightly
  // lower opacity so it reads as quiet chrome; engaging it (modal open) lifts
  // it back to full. Smoothly animated.
  const searchDim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(searchDim, {
      toValue: collapsed && !searchOpen ? 0.72 : 1,
      duration: reduceMotion.current ? 0 : 240,
      useNativeDriver: true,
    }).start();
  }, [collapsed, searchOpen, searchDim]);

  const profile = useGetV1UsersProfile({ query: { enabled: isAuthenticated } });
  const photoURL = profile.data?.photoURL ?? undefined;
  const name = profile.data?.name ?? currentUser?.name ?? currentUser?.email ?? t("app.header.you");

  return (
    <View style={{ paddingTop: insets.top }}>
      {/* Surface + bottom hairline as a fading layer behind the content, so the
          header turns transparent as it collapses to just the search. */}
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: editorialPalette.surface,
          borderBottomWidth: 1,
          borderBottomColor: editorialPalette.hairline,
          opacity: surfaceOpacity,
        }}
      />
      <XStack alignItems="center" height={BAR_HEIGHT} paddingHorizontal={16}>
        {/* Left — rounded avatar → account menu (slides away when collapsed) */}
        <Animated.View style={[{ alignItems: "flex-start" }, sideStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("app.header.openAccountMenu")}
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
          >
            <Avatar src={photoURL} name={name} size="md" />
          </Pressable>
        </Animated.View>

        {/* Center — global search trigger → fullscreen modal. Collapsed (V5)
            only when the Vagas header has collapsed to just the search; the
            accent focus ring (V3) shows whenever search is engaged, in both. */}
        <Animated.View style={{ flex: 1, marginHorizontal: 10, opacity: searchDim }}>
          <SearchTrigger
            onPress={() => setSearchOpen(true)}
            collapsed={collapsed}
            active={searchOpen}
          />
        </Animated.View>

        {/* Right — spacer matching the avatar column so the search stays
            optically centered (Messages now lives in the bottom tab bar). */}
        <Animated.View style={sideStyle} />
      </XStack>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <ProfileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        name={name}
        headline={profile.data?.headline ?? undefined}
        location={profile.data?.location ?? undefined}
        photoURL={photoURL}
      />
    </View>
  );
}
