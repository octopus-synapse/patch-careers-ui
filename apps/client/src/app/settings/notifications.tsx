/**
 * Notifications — per career-type, two channels: "On your phone" (in-app +
 * lock-screen, persisted together) and "Email". The in-app inbox isn't a
 * separate user control, mirroring mature consumer apps.
 */

import {
  type PutV1NotificationsPreferencesTypePathParamsTypeEnum,
  useGetV1NotificationsPreferences,
  usePutV1NotificationsPreferencesType,
} from "@patch-careers/api-client";
import { ToggleField, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SectionHeader, SettingsCard, SettingsScreenShell, useSet } from "@/features/settings";
import { useI18n } from "@/providers/i18n-provider";

type Channels = { inAppEnabled: boolean; emailEnabled: boolean; pushEnabled: boolean };
const DEFAULTS: Channels = { inAppEnabled: true, emailEnabled: true, pushEnabled: false };
// MVP career notification types (stable module constant so the seeding effect
// has no reactive dependency on render-built arrays).
const TYPE_KEYS = ["MATCH_RECOMMENDATIONS_READY", "MESSAGE_RECEIVED"] as const;

export default function NotificationsScreen(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const query = useGetV1NotificationsPreferences();
  const put = usePutV1NotificationsPreferencesType();
  const [state, setState] = useState<Record<string, Channels>>({});

  const labelFor = (key: string): string =>
    key === "MESSAGE_RECEIVED"
      ? t("settings.notifications.types.newMessage")
      : t("settings.notifications.types.jobMatch");

  // Two channels. "On your phone" drives both in-app + push together (the phone
  // notification, in and out of the app); email stays independent.
  const rows: ReadonlyArray<{
    label: string;
    value: (c: Channels) => boolean;
    patch: (v: boolean) => Partial<Channels>;
  }> = [
    {
      label: t("settings.notifications.channels.device"),
      value: (c) => c.pushEnabled,
      patch: (v) => ({ inAppEnabled: v, pushEnabled: v }),
    },
    {
      label: t("settings.notifications.channels.email"),
      value: (c) => c.emailEnabled,
      patch: (v) => ({ emailEnabled: v }),
    },
  ];

  useEffect(() => {
    const prefs = query.data?.preferences ?? [];
    const next: Record<string, Channels> = {};
    for (const key of TYPE_KEYS) {
      const p = prefs.find((x) => x.type === key);
      next[key] = {
        inAppEnabled: p?.inAppEnabled ?? DEFAULTS.inAppEnabled,
        emailEnabled: p?.emailEnabled ?? DEFAULTS.emailEnabled,
        pushEnabled: p?.pushEnabled ?? DEFAULTS.pushEnabled,
      };
    }
    setState(next);
  }, [query.data]);

  const ready = Object.keys(state).length > 0;

  const save = (typeKey: string, patch: Partial<Channels>): void => {
    const current = state[typeKey] ?? DEFAULTS;
    const merged: Channels = { ...current, ...patch };
    setState((s) => ({ ...s, [typeKey]: merged }));
    put.mutate({
      type: typeKey as PutV1NotificationsPreferencesTypePathParamsTypeEnum,
      data: merged,
    });
  };

  return (
    <SettingsScreenShell title={t("settings.notifications.title")}>
      <Text style={styles.intro}>{t("settings.notifications.intro")}</Text>
      {!ready ? (
        <ActivityIndicator color={palette.ink} style={{ marginTop: 24 }} />
      ) : (
        TYPE_KEYS.map((key) => {
          const cs = state[key] ?? DEFAULTS;
          return (
            <View key={key}>
              <SectionHeader label={labelFor(key)} />
              <SettingsCard>
                <View style={styles.cardInner}>
                  {rows.map((row) => (
                    <View key={row.label} style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>{row.label}</Text>
                      <ToggleField
                        value={row.value(cs)}
                        onValueChange={(v) => save(key, row.patch(v))}
                      />
                    </View>
                  ))}
                </View>
              </SettingsCard>
            </View>
          );
        })
      )}
    </SettingsScreenShell>
  );
}
