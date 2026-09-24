/**
 * EditorialTabBar — the app's custom bottom tab bar ("Editorial Slide").
 *
 * Active tab = icon-only brand-green circle; inactive = outline icon + label.
 * The Profile tab renders the avatar (with a presence dot) via its screen's
 * `tabBarIcon`. Messages is temporarily filtered from this mobile presenter.
 *
 * The icon-over-label columns come from the shared `TabBarItem` primitive
 * (`@patch-careers/ui/editorial`). This file owns the navigation wiring and
 * the raised floating-dock placement used only by the app's mobile chrome.
 *
 * Wired into expo-router as `<Tabs tabBar={(p) => <EditorialTabBar {...p} />}>`.
 * Icons and labels stay declared per-screen in `(tabs)/_layout.tsx` (read here
 * from `descriptors[route.key].options`), so this bar is a pure presenter over
 * the navigation state.
 */
import { shadows } from "@patch-careers/tokens";
import { TabBarItem, useEditorialPalette } from "@patch-careers/ui/editorial";
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { type ReactElement, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_INDICATOR_HEIGHT = 56;
const ACTIVE_INDICATOR_GUTTER = 4;
const USE_NATIVE_DRIVER = Platform.OS !== "web";

export function EditorialTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): ReactElement {
  const palette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12);
  const [rowWidth, setRowWidth] = useState(0);
  // The mobile product temporarily removes Messages from its primary nav.
  // Desktop never renders this bar and keeps Messages in the top navbar.
  const visibleRoutes = state.routes.filter((route) => route.name !== "messages");
  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === state.routes[state.index]?.key),
  );
  const activeIndex = useRef(new Animated.Value(activeVisibleIndex)).current;
  // Report our measured height so screens can pad their scroll content (via
  // `useBottomTabBarHeight()`) — the bar floats over the content so the blur
  // has something to frost.
  const setTabBarHeight = useContext(BottomTabBarHeightCallbackContext);

  const tabWidth = rowWidth / visibleRoutes.length;
  const indicatorX = activeIndex.interpolate({
    inputRange: [0, Math.max(1, visibleRoutes.length - 1)],
    outputRange: [
      ACTIVE_INDICATOR_GUTTER,
      tabWidth * Math.max(1, visibleRoutes.length - 1) + ACTIVE_INDICATOR_GUTTER,
    ],
  });

  useEffect(() => {
    Animated.timing(activeIndex, {
      toValue: activeVisibleIndex,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [activeIndex, activeVisibleIndex]);

  return (
    <View
      style={[
        styles.bar,
        {
          bottom: bottomOffset,
          backgroundColor: palette.panel,
          ...shadows.md.mobile,
        },
      ]}
      onLayout={(e) => setTabBarHeight?.(e.nativeEvent.layout.height + bottomOffset)}
    >
      <View style={styles.row} onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
        {rowWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeIndicator,
              {
                width: tabWidth - ACTIVE_INDICATOR_GUTTER * 2,
                backgroundColor: palette.primary,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        ) : null}
        {visibleRoutes.map((route) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const { options } = descriptor;
          const focused = state.routes[state.index]?.key === route.key;
          const label = typeof options.tabBarLabel === "string" ? options.tabBarLabel : route.name;

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
              presentation="mobileNavigation"
              showActiveIndicator={false}
            />
          );
        })}
      </View>
    </View>
  );
}

// @style-allow stylesheet: animated tab bar (floating frosted bar primitive + measured height callback)
const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 64,
    borderRadius: 32,
  },
  row: { position: "relative", flexDirection: "row", height: 64 },
  activeIndicator: {
    position: "absolute",
    top: 4,
    left: 0,
    height: ACTIVE_INDICATOR_HEIGHT,
    borderRadius: ACTIVE_INDICATOR_HEIGHT / 2,
  },
});
