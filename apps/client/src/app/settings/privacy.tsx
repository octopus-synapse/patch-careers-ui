/** Privacy — profile visibility + who-can-message pills, and a Blocked row. */

import {
  useGetV1UsersPreferencesFull,
  usePatchV1UsersPreferencesFull,
} from "@patch-careers/api-client";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { Ban } from "lucide-react-native";
import { type ReactElement, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  type MessagePrivacy,
  PillSelect,
  type ProfileVisibility,
  SectionHeader,
  SettingsCard,
  SettingsRow,
  SettingsScreenShell,
  useSet,
} from "@/features/settings";
import { useI18n } from "@/providers/i18n-provider";

export default function PrivacyScreen(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const router = useRouter();
  const prefsQuery = useGetV1UsersPreferencesFull();
  const patch = usePatchV1UsersPreferencesFull();

  // Local copies give the pills instant feedback on tap; they're seeded from
  // the server response and fall back to the backend defaults so a missing
  // field never strands the screen on a spinner.
  const prefs = prefsQuery.data?.preferences;
  const [visibility, setVisibility] = useState<ProfileVisibility | null>(null);
  const [messaging, setMessaging] = useState<MessagePrivacy | null>(null);

  useEffect(() => {
    if (prefs) {
      setVisibility(prefs.profileVisibility as ProfileVisibility);
      setMessaging(prefs.messagePrivacy as MessagePrivacy);
    }
  }, [prefs]);

  const visValue = visibility ?? (prefs?.profileVisibility as ProfileVisibility) ?? "PRIVATE";
  const msgValue = messaging ?? (prefs?.messagePrivacy as MessagePrivacy) ?? "EVERYONE";

  const visOptions = [
    { value: "PUBLIC" as const, label: t("settings.privacy.visibility.public") },
    { value: "RECRUITERS_ONLY" as const, label: t("settings.privacy.visibility.recruiters") },
    { value: "PRIVATE" as const, label: t("settings.privacy.visibility.private") },
  ];
  const msgOptions = [
    { value: "EVERYONE" as const, label: t("settings.privacy.messaging.everyone") },
    { value: "RECRUITERS_ONLY" as const, label: t("settings.privacy.messaging.recruiters") },
    { value: "NOBODY" as const, label: t("settings.privacy.messaging.nobody") },
  ];

  return (
    <SettingsScreenShell title={t("settings.privacy.title")}>
      {prefsQuery.isPending ? (
        <ActivityIndicator color={palette.ink} style={{ marginTop: 32 }} />
      ) : prefsQuery.isError ? (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text style={styles.bodyText}>{t("settings.privacy.loadError")}</Text>
          <Pressable onPress={() => prefsQuery.refetch()} disabled={prefsQuery.isFetching}>
            <Text style={[styles.bodyText, { color: palette.accent, fontWeight: "600" }]}>
              {t("settings.privacy.retry")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <SectionHeader label={t("settings.privacy.visibility.label")} />
          <SettingsCard>
            <View style={styles.cardInner}>
              <PillSelect<ProfileVisibility>
                options={visOptions}
                value={visValue}
                onChange={(v) => {
                  setVisibility(v);
                  patch.mutate({ data: { profileVisibility: v } });
                }}
              />
            </View>
          </SettingsCard>

          <SectionHeader label={t("settings.privacy.messaging.label")} />
          <SettingsCard>
            <View style={styles.cardInner}>
              <PillSelect<MessagePrivacy>
                options={msgOptions}
                value={msgValue}
                onChange={(v) => {
                  setMessaging(v);
                  patch.mutate({ data: { messagePrivacy: v } });
                }}
              />
            </View>
          </SettingsCard>

          <View style={{ height: 10 }} />
          <SettingsCard>
            <SettingsRow
              first
              icon={Ban}
              label={t("settings.privacy.blockedRow")}
              onPress={() => router.push("/settings/blocked")}
            />
          </SettingsCard>
        </>
      )}
    </SettingsScreenShell>
  );
}
