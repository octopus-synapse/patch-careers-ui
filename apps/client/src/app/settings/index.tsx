/**
 * Settings home — two screens behind one route.
 *
 * Mobile: an IG-style grouped list, each group a row that pushes its
 * sub-screen, sign-out pinned at the bottom. Desktop web: the whole of settings
 * on one page (`SettingsDesktopPage`), because there the four sections fit
 * together and a hub that only forwards you elsewhere earns nothing.
 */

import { logout } from "@patch-careers/auth";
import { YStack } from "@patch-careers/ui";
import { SettingsCard, SettingsRow } from "@patch-careers/ui/editorial";
import { type Href, useRouter } from "expo-router";
import { Bell, LockKeyhole, LogOut, Palette, UserRound } from "lucide-react-native";
import type { ReactElement } from "react";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { SettingsDesktopPage } from "@/features/settings";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useI18n } from "@/providers/i18n-provider";

export default function SettingsHome(): ReactElement {
  const { t } = useI18n();
  const router = useRouter();
  const isDesktopWeb = useIsDesktopWeb();
  const go = (path: Href): void => router.push(path);

  // Desktop web has no hub screen: every section fits on one page there, with
  // the rail marking which one you are reading. `?section=` opens it partway.
  if (isDesktopWeb) return <SettingsDesktopPage />;

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

      <YStack height={18} />
      <SettingsCard>
        <SettingsRow first danger icon={LogOut} label={t("settings.signOut")} onPress={signOut} />
      </SettingsCard>
    </SettingsScreenShell>
  );
}
