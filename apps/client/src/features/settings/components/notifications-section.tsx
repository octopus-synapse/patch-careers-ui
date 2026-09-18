/**
 * `NotificationsSection` — per career-type notification channels ("On your
 * phone" and "Email").
 *
 * Body only, no frame: the mobile route wraps it in `SettingsScreenShell`, the
 * desktop single page stacks it with the other three.
 */

import {
  type PutV1NotificationsPreferencesTypePathParamsTypeEnum,
  useGetV1NotificationsPreferences,
  usePutV1NotificationsPreferencesType,
} from "@patch-careers/api-client";
import { YStack } from "@patch-careers/ui";
import { SettingsCard, ToggleField, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";
import { useNotifications } from "@/providers/notifications-provider";
import { useSet } from "../lib/styles";
import { SectionHeader } from "./settings-ui";

type Channels = { inAppEnabled: boolean; emailEnabled: boolean; pushEnabled: boolean };
const DEFAULTS: Channels = { inAppEnabled: true, emailEnabled: true, pushEnabled: false };
// MVP career notification types (stable module constant so the seeding effect
// has no reactive dependency on render-built arrays).
const TYPE_KEYS = ["MATCH_RECOMMENDATIONS_READY", "MESSAGE_RECEIVED"] as const;

export function NotificationsSection(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const query = useGetV1NotificationsPreferences();
  const put = usePutV1NotificationsPreferencesType();
  const { enablePush } = useNotifications();
  const isDesktopWeb = useIsDesktopWeb();
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

  const persist = (typeKey: string, merged: Channels): void => {
    setState((s) => ({ ...s, [typeKey]: merged }));
    put.mutate({
      type: typeKey as PutV1NotificationsPreferencesTypePathParamsTypeEnum,
      data: merged,
    });
  };

  const save = (typeKey: string, patch: Partial<Channels>): void => {
    const current = state[typeKey] ?? DEFAULTS;
    const merged: Channels = { ...current, ...patch };

    if (patch.pushEnabled === true && !current.pushEnabled) {
      void (async () => {
        // The OS prompt and the device registration behind it belong to the
        // notifications provider — a settings screen only asks for the outcome.
        const result = await enablePush();
        if (result.outcome === "declined") return;
        if (result.outcome === "error") {
          Alert.alert(
            t("settings.notifications.pushErrorTitle"),
            result.reason
              ? `${t("settings.notifications.pushErrorBody")}\n\n${result.reason}`
              : t("settings.notifications.pushErrorBody"),
          );
          return;
        }
        persist(typeKey, merged);
      })();
      return;
    }

    persist(typeKey, merged);
  };

  return (
    <>
      {isDesktopWeb ? null : <Text style={styles.intro}>{t("settings.notifications.intro")}</Text>}
      {!ready ? (
        <YStack marginTop={24}>
          <ActivityIndicator color={palette.ink} />
        </YStack>
      ) : isDesktopWeb ? (
        // Desktop web mirrors the approved demo: channel headers float above
        // the card, one 52px row per type with a toggle per channel column.
        <View>
          <View style={styles.matrixHeader}>
            <View style={styles.matrixHeaderSpacer} />
            <Text style={styles.matrixHeaderLabel}>
              {t("settings.notifications.channels.push")}
            </Text>
            <Text style={styles.matrixHeaderLabel}>
              {t("settings.notifications.channels.email")}
            </Text>
          </View>
          <SettingsCard>
            {TYPE_KEYS.map((key, index) => {
              const cs = state[key] ?? DEFAULTS;
              return (
                <View
                  key={key}
                  style={[styles.matrixRow, index === 0 ? null : styles.selectRowDivider]}
                >
                  <Text style={styles.matrixRowLabel}>{labelFor(key)}</Text>
                  {rows.map((row) => (
                    <View key={row.label} style={styles.matrixCell}>
                      <ToggleField
                        value={row.value(cs)}
                        onValueChange={(v) => save(key, row.patch(v))}
                      />
                    </View>
                  ))}
                </View>
              );
            })}
          </SettingsCard>
        </View>
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
    </>
  );
}
