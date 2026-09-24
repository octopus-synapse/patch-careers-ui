import { AppRedirect } from "@/navigation/app-redirect";
/**
 * Preferences — theme + language. Frame only; the body is `PreferencesSection`
 * (see `account.tsx` for why).
 */

import type { ReactElement } from "react";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { PreferencesSection, settingsSectionHref } from "@/features/settings";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";

export default function PreferencesScreen(): ReactElement {
  const { t } = useI18n();
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) return <AppRedirect href={settingsSectionHref("preferences")} />;

  return (
    <SettingsScreenShell title={t("settings.preferences.title")}>
      <PreferencesSection />
    </SettingsScreenShell>
  );
}
