/**
 * Reset-password screen — root `/reset-password` path (universal links of
 * the form `https://patchcareers.com/reset-password?token=X` land here).
 *
 * D100: token from the deep link → 2 password inputs + strength meter →
 * POST /v1/auth/reset-password → toast + bounce to /sign-in. "Editorial
 * Calm" DS (PasswordInput owns its own show/hide eye toggle).
 */

import { postV1AuthResetPassword } from "@patch-careers/api-client";
import {
  AuthShell,
  Banner,
  IntroBlock,
  PasswordStrengthMeter,
  PrimaryAction,
} from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { AuthPasswordField } from "@/components/auth/fields";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";

export default function ResetPasswordScreen(): ReactElement {
  const { t, router, toast } = useAuthScreen();
  const { submitting, run } = useSubmit();
  const params = useLocalSearchParams<{ token?: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState<string | undefined>(undefined);

  const tokenMissing = !params.token || params.token.length === 0;

  async function handleSubmit() {
    if (newPassword !== confirmPassword) {
      setMismatchError(t("auth.resetMismatch"));
      return;
    }
    if (tokenMissing) return;
    setMismatchError(undefined);
    await run(async () => {
      try {
        await postV1AuthResetPassword({ token: params.token as string, newPassword });
        toast.show({ title: t("auth.resetSuccess"), intent: "success" });
        router.replace("/(auth)/sign-in");
      } catch {
        toast.show({ title: t("auth.resetInvalidToken"), intent: "danger" });
      }
    });
  }

  if (tokenMissing) {
    return (
      <AuthShell>
        <IntroBlock emphasis={t("auth.resetTitle")} subtitle={t("auth.resetInvalidToken")} />
        <View style={{ gap: 24 }}>
          <Banner intent="danger" testID="reset.invalidToken">
            {t("auth.resetInvalidToken")}
          </Banner>
          <PrimaryAction
            label={t("auth.forgotPassword")}
            onPress={() => router.replace("/(auth)/forgot-password")}
            testID="reset.requestNew"
          />
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <IntroBlock emphasis={t("auth.resetTitle")} subtitle={t("auth.resetNewPassword")} />
      <View style={{ gap: 24 }}>
        <AuthPasswordField
          label={t("auth.resetNewPassword")}
          value={newPassword}
          onChangeText={(next) => {
            setNewPassword(next);
            if (mismatchError) setMismatchError(undefined);
          }}
          testID="reset.password"
          isNew
          returnKeyType="next"
        >
          <PasswordStrengthMeter password={newPassword} />
        </AuthPasswordField>

        <AuthPasswordField
          label={t("auth.resetConfirmPassword")}
          value={confirmPassword}
          onChangeText={(next) => {
            setConfirmPassword(next);
            if (mismatchError) setMismatchError(undefined);
          }}
          error={mismatchError}
          testID="reset.confirm"
          isNew
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <View style={{ marginTop: 8 }}>
          <PrimaryAction
            label={t("common.submit")}
            loading={submitting}
            onPress={handleSubmit}
            testID="reset.submit"
          />
        </View>
      </View>
    </AuthShell>
  );
}
