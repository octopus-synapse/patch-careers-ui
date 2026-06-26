import type { ReactElement } from "react";

/**
 * Bottom tab bar (D51 — fixed bottom tab) with 4 tabs:
 *
 *   Vagas · Mensagens · Notificações · Perfil
 *
 * "Candidaturas" was folded into the Vagas tab as a third scope
 * (Todas · Salvas · Candidaturas), so it no longer has its own tab. Messages
 * was promoted from an AppHeader quick-action to its own tab.
 *
 * Labels come from the i18n dictionaries (`tabs.*`) so they follow the
 * user's locale. Icons come from Expo Vector Icons so active tabs can use
 * filled icons while inactive tabs stay outlined. Active color uses our
 * accent intent so the tab bar follows the theme.
 */

import { Ionicons } from "@expo/vector-icons";
import { useEditorialPalette } from "@patch-careers/ui";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  // Opt a tab out of the global AppHeader: drop the navbar *and* reserve the
  // safe-area top space on the scene so content isn't clipped by the status
  // bar/notch. Spread into any tab that should be header-less — that's the
  // only line a new tab needs.
  const headerlessTab = {
    headerShown: false,
    sceneStyle: { backgroundColor: palette.bg, paddingTop: insets.top },
  } as const;

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
        name="messages"
        options={{
          ...headerlessTab,
          title: t("tabs.messages"),
          tabBarIcon: tabIcon("chatbubble-ellipses-outline", "chatbubble-ellipses"),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t("tabs.notifications"),
          tabBarIcon: tabIcon("notifications-outline", "notifications"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          ...headerlessTab,
          title: t("tabs.profile"),
          tabBarIcon: ({ focused, size }) => <ProfileTabIcon focused={focused} size={size} />,
        }}
      />
    </Tabs>
  );
}
