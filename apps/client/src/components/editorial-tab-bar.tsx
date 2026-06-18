/**
 * EditorialTabBar — the app's custom bottom tab bar ("Editorial Slide").
 *
 * Active tab = ink + filled icon + ink small-caps label; inactive = muted +
 * outline icon. No sliding rail — the active state reads purely from ink/fill
 * contrast, matching the rest of the Editorial Calm system. Notifications
 * carries a live count badge; the Profile tab renders the avatar (with a
 * presence dot) via its screen's `tabBarIcon`.
 *
 * Layout is uniform by construction: every tab is `flex: 1` and its glyph sits
 * in a fixed-height band (`ICON_BAND`), so the Profile avatar (sized to match
 * the glyphs) never makes that column taller — labels stay on one baseline.
 * The bar is a frosted (blurred) translucent surface, à la iOS/WhatsApp.
 *
 * Wired into expo-router as `<Tabs tabBar={(p) => <EditorialTabBar {...p} />}>`.
 * Icons and labels stay declared per-screen in `(tabs)/_layout.tsx` (read here
 * from `descriptors[route.key].options`), so this bar is a pure presenter over
 * the navigation state.
 */
import { useGetV1NotificationsUnreadCount } from "@patch-careers/api-client";
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { CountBadge, editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { type ReactElement, useContext } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The screen whose icon carries the unread-notifications badge.
const NOTIFICATIONS_ROUTE = "notifications";
const ICON_SIZE = 22;
// Fixed band the glyph/avatar centers in — a couple px of slack above ICON_SIZE
// so nothing clips, while keeping every tab's icon row the exact same height.
const ICON_BAND = 26;

// Blur tint + a translucent surface wash (so the editorial color still reads
// over whatever shows through). Keyed by theme.
const BLUR = {
  light: { tint: "light", intensity: 60, wash: "rgba(255,255,255,0.45)" },
  dark: { tint: "dark", intensity: 50, wash: "rgba(30,29,25,0.4)" },
} as const;

export function EditorialTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): ReactElement {
  const theme = useThemeName();
  const styles = stylesByTheme[theme];
  const palette = theme === "dark" ? editorialPaletteDark : editorialPalette;
  const blur = BLUR[theme];
  const insets = useSafeAreaInsets();
  // Report our measured height so screens can pad their scroll content (via
  // `useBottomTabBarHeight()`) — the bar floats over the content so the blur
  // has something to frost.
  const setTabBarHeight = useContext(BottomTabBarHeightCallbackContext);

  // Live count, polled like the header's messages badge (React Query dedupes).
  const notifications = useGetV1NotificationsUnreadCount({
    query: { refetchInterval: 30_000 },
  });
  const unreadNotifications = notifications.data?.count ?? 0;

  return (
    <View
      style={[styles.bar, { paddingBottom: insets.bottom }]}
      onLayout={(e) => setTabBarHeight?.(e.nativeEvent.layout.height)}
    >
      <BlurView tint={blur.tint} intensity={blur.intensity} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: blur.wash }]} />
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const { options } = descriptor;
          const focused = state.index === index;
          const color = focused ? palette.ink : palette.muted;
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
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            >
              <View style={styles.iconBand}>
                {/* Tight wrapper so the badge anchors to the glyph's corner. */}
                <View style={styles.glyph}>
                  {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
                  {route.name === NOTIFICATIONS_ROUTE ? (
                    <CountBadge count={unreadNotifications} />
                  ) : null}
                </View>
              </View>
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    bar: {
      // Float over the content so the BlurView has something to frost.
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderTopWidth: 1,
      borderTopColor: p.hairline,
      // Transparent so the BlurView + wash below show through; overflow keeps
      // the blur clipped to the bar.
      backgroundColor: "transparent",
      overflow: "hidden",
    },
    row: { flexDirection: "row" },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 8,
      paddingBottom: 6,
      gap: 4,
    },
    // Press feedback via opacity only — no scale, so tabs never resize.
    tabPressed: { opacity: 0.55 },
    // Fixed-height band every tab shares → uniform columns, aligned labels.
    iconBand: { height: ICON_BAND, alignItems: "center", justifyContent: "center" },
    // Containing block for the absolutely-positioned CountBadge.
    glyph: { position: "relative" },
    label: {
      fontFamily: fonts.sans,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontWeight: "600",
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
