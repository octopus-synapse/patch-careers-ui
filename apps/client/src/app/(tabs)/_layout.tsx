import type { ReactElement } from "react";

/**
 * Bottom tab bar (D51 — fixed bottom tab) with 4 tabs (D52):
 *
 *   Jobs · Applications · Notifications · Profile
 *
 * Labels come from the i18n dictionaries (`tabs.*`) so they follow the
 * user's locale. Icons come from Expo Vector Icons so active tabs can use
 * filled icons while inactive tabs stay outlined. Active color uses our
 * accent intent so the tab bar follows the theme.
 */

import { Ionicons } from "@expo/vector-icons";
import { useEditorialPalette } from "@patch-careers/ui";
import { Redirect, Tabs } from "expo-router";
import { AppHeader } from "@/components/app-header";
import { EditorialTabBar } from "@/components/editorial-tab-bar";
import { ProfileTabIcon } from "@/components/profile-tab-icon";
import { AUTH_SIGN_IN_ROUTE, VERIFY_EMAIL_ROUTE } from "@/navigation/auth-redirect";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(outline: IoniconName, filled: IoniconName) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? filled : outline} color={color} size={size} />
  );
}

export default function TabsLayout(): ReactElement | null {
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser, isAuthenticated } = useAuthState();
  const palette = useEditorialPalette();
  const { t } = useI18n();

  if (!hasBootstrapped) return null;
  if (!isAuthenticated) return <Redirect href={AUTH_SIGN_IN_ROUTE} />;
  if (currentUser?.needsEmailVerification) return <Redirect href={VERIFY_EMAIL_ROUTE} />;

  return (
    <Tabs
      tabBar={(props) => <EditorialTabBar {...props} />}
      screenOptions={{
        // Global top app bar: avatar (left) · brand (center) · messages (right).
        headerShown: true,
        header: () => <AppHeader />,
        // The custom EditorialTabBar owns the bar's look; only the scene bg
        // stays here. `title` feeds each tab's label/a11y; `tabBarIcon` feeds
        // its glyph (read from the descriptor by the custom bar).
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: t("tabs.jobs"),
          tabBarIcon: tabIcon("briefcase-outline", "briefcase"),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: t("tabs.applicationsShort"),
          tabBarIcon: tabIcon("send-outline", "send"),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t("tabs.notificationsShort"),
          tabBarIcon: tabIcon("notifications-outline", "notifications"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused, size }) => <ProfileTabIcon focused={focused} size={size} />,
        }}
      />
    </Tabs>
  );
}
