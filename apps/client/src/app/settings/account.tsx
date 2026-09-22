import { AppRedirect } from "@/navigation/app-redirect";
/**
 * Account — e-mail, password, 2FA, username, connected accounts, plus the
 * account actions (export / deactivate / delete).
 *
 * The screen is a frame around `AccountSection`; the body itself lives in the
 * feature, because desktop web stacks it with the other three sections on the
 * single settings page instead of giving it a route of its own. This route
 * still exists for mobile and for deep links, which desktop forwards inward.
 */


import type { ReactElement } from "react";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { AccountSection, settingsSectionHref } from "@/features/settings";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";

export default function AccountScreen(): ReactElement {
  const { t } = useI18n();
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) return <AppRedirect href={settingsSectionHref("account")} />;

  return (
    <SettingsScreenShell
      title={t("settings.account.title")}
      description={t("settings.account.description")}
    >
      <AccountSection />
    </SettingsScreenShell>
  );
}
