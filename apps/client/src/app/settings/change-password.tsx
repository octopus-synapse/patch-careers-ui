/** Change password (step 1) — current + new + confirm → emailed code. */

import { usePostV1MePasswordChangeRequest } from "@patch-careers/api-client";
import { PrimaryAction, UnderlineInput } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { Text, View } from "react-native";
import { SettingsScreenShell, useSet } from "@/features/settings";
import { useI18n } from "@/providers/i18n-provider";

export default function ChangePasswordScreen(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const router = useRouter();
  const req = usePostV1MePasswordChangeRequest();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm && !req.isPending;

  const submit = (): void => {
    setError("");
    req.mutate(
      { data: { currentPassword: current, newPassword: next } },
      {
        onSuccess: () =>
          router.push({ pathname: "/settings/verify-code", params: { flow: "password" } }),
        onError: () => setError(t("common.error")),
      },
    );
  };

  return (
    <SettingsScreenShell title={t("settings.account.changePassword.title")}>
      <Text style={styles.intro}>{t("settings.account.changePassword.intro")}</Text>
      <View style={styles.fieldBlock}>
        <UnderlineInput
          label={t("settings.account.changePassword.current")}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <View style={styles.fieldBlock}>
        <UnderlineInput
          label={t("settings.account.changePassword.new")}
          value={next}
          onChangeText={setNext}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <View style={styles.fieldBlock}>
        <UnderlineInput
          label={t("settings.account.changePassword.confirm")}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          hasError={mismatch}
        />
        {mismatch ? (
          <Text style={styles.errorText}>{t("settings.account.changePassword.mismatch")}</Text>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={{ marginTop: 12 }}>
        <PrimaryAction
          label={t("settings.account.changePassword.submit")}
          onPress={submit}
          loading={req.isPending}
          disabled={!canSubmit}
        />
      </View>
    </SettingsScreenShell>
  );
}
