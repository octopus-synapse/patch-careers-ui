/**
 * EditorialTabBar — the app's custom bottom tab bar ("Editorial Slide").
 *
 * Active tab = ink + filled icon + ink small-caps label; inactive = muted +
 * outline icon. No sliding rail — the active state reads purely from ink/fill
 * contrast, matching the rest of the Editorial Calm system. Notifications and
 * Messages each carry a live count badge; the Profile tab renders the avatar
 * (with a presence dot) via its screen's `tabBarIcon`.
 *
 * The frosted surface and the icon-over-label columns come from the shared
 * `FrostedBar`/`TabBarItem` primitives (`@patch-careers/ui/editorial`), so this
 * bar and the in-screen scope tabs (e.g. Jobs) render the exact same material.
 * This file owns only the navigation wiring + the bar's floating placement.
 *
 * Wired into expo-router as `<Tabs tabBar={(p) => <EditorialTabBar {...p} />}>`.
 * Icons and labels stay declared per-screen in `(tabs)/_layout.tsx` (read here
 * from `descriptors[route.key].options`), so this bar is a pure presenter over
 * the navigation state.
 */
import { useGetV1ChatUnread, useGetV1NotificationsUnreadCount } from "@patch-careers/api-client";
import {
  CountBadge,
  FrostedBar,
  TabBarItem,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { type ReactElement, useContext } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The screens whose icons carry a live unread badge.
const NOTIFICATIONS_ROUTE = "notifications";
const MESSAGES_ROUTE = "messages";

export function EditorialTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): ReactElement {
  const palette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  // Report our measured height so screens can pad their scroll content (via
  // `useBottomTabBarHeight()`) — the bar floats over the content so the blur
  // has something to frost.
  const setTabBarHeight = useContext(BottomTabBarHeightCallbackContext);

  // Live counts, polled (React Query dedupes against any other caller).
  const notifications = useGetV1NotificationsUnreadCount({
    query: { refetchInterval: 30_000 },
  });
  const unreadNotifications = notifications.data?.count ?? 0;
  const chat = useGetV1ChatUnread({ query: { refetchInterval: 30_000 } });
  const unreadMessages = chat.data?.totalUnread ?? 0;

  return (
    <FrostedBar
      style={[styles.bar, { paddingBottom: insets.bottom, borderTopColor: palette.hairline }]}
      onLayout={(e) => setTabBarHeight?.(e.nativeEvent.layout.height)}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const { options } = descriptor;
          const focused = state.index === index;
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (focused || event.defaultPrevented) return;
            if (Platform.OS !== "web") void Haptics.selectionAsync();
            navigation.navigate(route.name);
          };

          return (
            <TabBarItem
              key={route.key}
              label={label}
              focused={focused}
              onPress={onPress}
              renderIcon={(args) => options.tabBarIcon?.(args) ?? null}
              badge={
                route.name === NOTIFICATIONS_ROUTE ? (
                  <CountBadge count={unreadNotifications} />
                ) : route.name === MESSAGES_ROUTE ? (
                  <CountBadge count={unreadMessages} />
                ) : null
              }
            />
          );
        })}
      </View>
    </FrostedBar>
  );
}

// @style-allow stylesheet: animated tab bar (floating frosted bar primitive + measured height callback)
const styles = StyleSheet.create({
  bar: {
    // Float over the content so the BlurView has something to frost.
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  row: { flexDirection: "row" },
});
