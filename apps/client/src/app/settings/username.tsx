/** Username — edit the public @handle (gated by the backend cooldown). */

import {
  getV1UsersProfileQueryKey,
  useGetV1UsersProfile,
  useGetV1UsersUsernameRules,
  usePatchV1UsersUsername,
} from "@patch-careers/api-client";
import { formatDate } from "@patch-careers/i18n";
import { PrimaryAction, UnderlineInput, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Text, View } from "react-native";
import { SettingsScreenShell, useSet } from "@/features/settings";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

export default function UsernameScreen(): ReactElement {
  const { t, locale } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthState();
  const { data: rules } = useGetV1UsersUsernameRules();
  const { data: profile } = useGetV1UsersProfile();
  const [value, setValue] = useState(currentUser?.username ?? "");
  const [error, setError] = useState("");
  const patch = usePatchV1UsersUsername();

  // The backend owns the cooldown: it returns the unlock instant (or null when
  // the user can change now), so the client never recomputes "30 days" itself.
  const availableAt = profile?.usernameChangeAvailableAt ?? null;
  const locked = availableAt !== null;
  const unlockDate = availableAt
    ? formatDate(availableAt, locale, { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const normalized = value.trim().toLowerCase();
  const changed = normalized.length >= 3 && normalized !== (currentUser?.username ?? "");

  const submit = (): void => {
    setError("");
    patch.mutate(
      { data: { username: normalized } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getV1UsersProfileQueryKey() });
          if (router.canGoBack()) router.back();
        },
        onError: () => setError(t("settings.account.username.taken")),
      },
    );
  };

  return (
    <SettingsScreenShell title={t("settings.account.username.title")}>
      <Text style={styles.intro}>{t("settings.account.username.intro")}</Text>

      {rules ? (
        <Text style={styles.ruleNote}>
          {t("settings.account.username.cooldownRule", { days: rules.cooldownDays })}
        </Text>
      ) : null}

      <View style={styles.fieldBlock}>
        <UnderlineInput
          label={t("settings.account.username.label")}
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          editable={!locked}
          hasError={Boolean(error)}
        />
      </View>

      {locked && unlockDate ? (
        <View style={styles.lockNote}>
          <Clock size={16} color={palette.muted} strokeWidth={1.75} />
          <Text style={styles.lockNoteText}>
            {t("settings.account.username.cooldown", { date: unlockDate })}
          </Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={{ marginTop: 12 }}>
        <PrimaryAction
          label={t("settings.account.username.submit")}
          onPress={submit}
          loading={patch.isPending}
          disabled={!changed || locked || patch.isPending}
        />
      </View>
    </SettingsScreenShell>
  );
}
