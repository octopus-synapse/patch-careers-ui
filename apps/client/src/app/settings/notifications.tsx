import { AppRedirect } from "@/navigation/app-redirect";
/**
 * Notifications — per career-type channels. Frame only; the body is
 * `NotificationsSection` (see `account.tsx` for why).
 *
 * The dev-only simulation block stays HERE rather than in the feature: firing a
 * fake notification talks to the notification service, and `features/settings`
 * may not import `features/notifications`. A route file may — and this block is
 * Expo Go's alone anyway, so it never renders on the desktop page that stacks
 * the section.
 */

import { SettingsCard, useEditorialPalette } from "@patch-careers/ui/editorial";

import type { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import {
  getNotificationService,
  isExpoGo,
  type NotificationRoutableType,
} from "@/features/notifications";
import {
  NotificationsSection,
  SectionHeader,
  settingsSectionHref,
  useSet,
} from "@/features/settings";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";

export default function NotificationsScreen(): ReactElement {
  const { t } = useI18n();
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) return <AppRedirect href={settingsSectionHref("notifications")} />;

  return (
    <SettingsScreenShell
      title={t("settings.notifications.title")}
      description={t("settings.notifications.intro")}
    >
      <NotificationsSection />
      {__DEV__ && isExpoGo() ? <NotificationDevTrigger /> : null}
    </SettingsScreenShell>
  );
}

function NotificationDevTrigger(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const rows: ReadonlyArray<{
    label: string;
    type: NotificationRoutableType;
    title: string;
    body: string;
  }> = [
    {
      label: t("notifications.dev.simulateMessage"),
      type: "MESSAGE_RECEIVED",
      title: t("notifications.dev.sim.messageTitle"),
      body: t("notifications.dev.sim.messageBody"),
    },
    {
      label: t("notifications.dev.simulateMatch"),
      type: "MATCH_RECOMMENDATIONS_READY",
      title: t("notifications.dev.sim.matchTitle"),
      body: t("notifications.dev.sim.matchBody"),
    },
    {
      label: t("notifications.dev.simulateResumeUp"),
      type: "RESUME_QUALITY_IMPROVED",
      title: t("notifications.dev.sim.resumeUpTitle"),
      body: t("notifications.dev.sim.resumeUpBody"),
    },
    {
      label: t("notifications.dev.simulateResumeDown"),
      type: "RESUME_QUALITY_REGRESSED",
      title: t("notifications.dev.sim.resumeDownTitle"),
      body: t("notifications.dev.sim.resumeDownBody"),
    },
  ];
  const fire = (row: { type: NotificationRoutableType; title: string; body: string }): void => {
    void getNotificationService().simulateIncoming?.(row.type, {
      title: row.title,
      body: row.body,
    });
  };
  return (
    <View>
      <SectionHeader label={t("notifications.dev.sectionTitle")} />
      <SettingsCard>
        <View style={styles.cardInner}>
          {rows.map((row) => (
            <Pressable
              key={row.type}
              accessibilityRole="button"
              style={styles.toggleRow}
              onPress={() => fire(row)}
            >
              <Text style={styles.toggleLabel}>{row.label}</Text>
              <Text style={{ color: palette.accent, fontWeight: "600" }}>▸</Text>
            </Pressable>
          ))}
        </View>
      </SettingsCard>
    </View>
  );
}
