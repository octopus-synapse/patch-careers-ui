/** Change email (step 1) — current password + new email → emailed code. */

import { usePostV1MeEmailChangeRequest } from "@patch-careers/api-client";
import { YStack } from "@patch-careers/ui";
import { PrimaryAction, UnderlineInput } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { Text, View } from "react-native";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { useSet } from "@/features/settings";
import { useI18n } from "@/providers/i18n-provider";

export default function ChangeEmailScreen(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const router = useRouter();
  const req = usePostV1MeEmailChangeRequest();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");

  const canSubmit = currentPassword.length > 0 && /\S+@\S+\.\S+/.test(newEmail) && !req.isPending;

  const submit = (): void => {
    setError("");
    req.mutate(
      { data: { currentPassword, newEmail } },
      {
        onSuccess: () =>
          router.push({
            pathname: "/settings/verify-code",
            params: { flow: "email", email: newEmail },
          }),
        onError: () => setError(t("common.error")),
      },
    );
  };

  return (
    <SettingsScreenShell title={t("settings.account.changeEmail.title")}>
      <Text style={styles.intro}>{t("settings.account.changeEmail.intro")}</Text>
      <View style={styles.fieldBlock}>
        <UnderlineInput
          label={t("settings.account.changeEmail.currentPassword")}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <View style={styles.fieldBlock}>
        <UnderlineInput
          label={t("settings.account.changeEmail.newEmail")}
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <YStack marginTop={12}>
        <PrimaryAction
          label={t("settings.account.changeEmail.submit")}
          onPress={submit}
          loading={req.isPending}
          disabled={!canSubmit}
        />
      </YStack>
    </SettingsScreenShell>
  );
}
