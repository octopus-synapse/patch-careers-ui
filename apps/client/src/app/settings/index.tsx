/**
 * Settings home — IG-style grouped list. Each group is a row that pushes its
 * sub-screen; sign-out is pinned at the bottom.
 */

import { logout } from "@patch-careers/auth";
import { type Href, useRouter } from "expo-router";
import { Bell, LockKeyhole, LogOut, Palette, UserRound } from "lucide-react-native";
import type { ReactElement } from "react";
import { View } from "react-native";
import { SettingsCard, SettingsRow, SettingsScreenShell } from "@/features/settings";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useI18n } from "@/providers/i18n-provider";

export default function SettingsHome(): ReactElement {
  const { t } = useI18n();
  const router = useRouter();
  const go = (path: Href): void => router.push(path);

  async function signOut(): Promise<void> {
    await logout();
    router.replace(AUTH_SIGN_IN_ROUTE);
  }

  return (
    <SettingsScreenShell title={t("settings.title")}>
      <SettingsCard>
        <SettingsRow
          first
          icon={UserRound}
          label={t("settings.account.title")}
          onPress={() => go("/settings/account")}
        />
        <SettingsRow
          icon={LockKeyhole}
          label={t("settings.privacy.title")}
          onPress={() => go("/settings/privacy")}
        />
        <SettingsRow
          icon={Bell}
          label={t("settings.notifications.title")}
          onPress={() => go("/settings/notifications")}
        />
        <SettingsRow
          icon={Palette}
          label={t("settings.preferences.title")}
          onPress={() => go("/settings/preferences")}
        />
      </SettingsCard>

      <View style={{ height: 18 }} />
      <SettingsCard>
        <SettingsRow first danger icon={LogOut} label={t("settings.signOut")} onPress={signOut} />
      </SettingsCard>
    </SettingsScreenShell>
  );
}
