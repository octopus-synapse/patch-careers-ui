import type { ReactElement } from "react";

/**
 * Bottom tab bar (D51 — fixed bottom tab) with 5 tabs (D52):
 *
 *   Jobs · Resume · Profile · Applications · Notifications
 *
 * Icons come from `lucide-react-native` (D57 / open-source, RN-native
 * via react-native-svg). Active color uses our accent intent so the
 * tab bar follows the theme.
 *
 * Placeholders here are intentional — PR #9-#18 fill each tab with
 * real screens.
 */

import { palette } from "@patch-careers/tokens";
import { Tabs } from "expo-router";
import { Bell, Briefcase, FileText, Send, User } from "lucide-react-native";

export default function TabsLayout(): ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.blue[600],
        tabBarInactiveTintColor: palette.gray[500],
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="resume"
        options={{
          title: "Resume",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: "Applications",
          tabBarIcon: ({ color, size }) => <Send color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
