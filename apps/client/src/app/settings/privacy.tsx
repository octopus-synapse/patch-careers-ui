import { AppRedirect } from "@/navigation/app-redirect";
/**
 * Privacy — profile visibility + who-can-message, and the Consent/Blocked rows.
 * Frame only; the body is `PrivacySection` (see `account.tsx` for why).
 */


import type { ReactElement } from "react";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { PrivacySection, settingsSectionHref } from "@/features/settings";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";

export default function PrivacyScreen(): ReactElement {
  const { t } = useI18n();
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) return <AppRedirect href={settingsSectionHref("privacy")} />;

  return (
    <SettingsScreenShell
      title={t("settings.privacy.title")}
      description={t("settings.privacy.description")}
    >
      <PrivacySection />
    </SettingsScreenShell>
  );
}
