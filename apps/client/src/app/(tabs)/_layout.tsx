import type { ReactElement } from "react";

/**
 * Bottom tab bar (D51 — fixed bottom tab) with 5 tabs (D52):
 *
 *   Jobs · Resume · Profile · Applications · Notifications
 *
 * Icons come from Expo Vector Icons so active tabs can use filled icons
 * while inactive tabs stay outlined. Active color uses our accent intent
 * so the tab bar follows the theme.
 *
 * Placeholders here are intentional — PR #9-#18 fill each tab with
 * real screens.
 */

import { Ionicons } from "@expo/vector-icons";
import { useEditorialPalette } from "@patch-careers/ui";
import { Redirect, Tabs } from "expo-router";
import { AppHeader } from "@/components/app-header";
import { AUTH_SIGN_IN_ROUTE, VERIFY_EMAIL_ROUTE } from "@/navigation/auth-redirect";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

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

  if (!hasBootstrapped) return null;
  if (!isAuthenticated) return <Redirect href={AUTH_SIGN_IN_ROUTE} />;
  if (currentUser?.needsEmailVerification) return <Redirect href={VERIFY_EMAIL_ROUTE} />;

  return (
    <Tabs
      screenOptions={{
        // Global top app bar: avatar (left) · brand (center) · messages (right).
        headerShown: true,
        header: () => <AppHeader />,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.hairline },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: tabIcon("briefcase-outline", "briefcase"),
        }}
      />
      <Tabs.Screen
        name="resume"
        options={{
          title: "Resume",
          tabBarIcon: tabIcon("document-text-outline", "document-text"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: tabIcon("person-outline", "person"),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: "Applications",
          tabBarIcon: tabIcon("send-outline", "send"),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: tabIcon("notifications-outline", "notifications"),
        }}
      />
    </Tabs>
  );
}
