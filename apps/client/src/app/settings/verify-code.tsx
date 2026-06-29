/**
 * Confirm code (step 2) for change-email / change-password. Both flows
 * invalidate sessions on success, so the user is signed out and sent to login.
 */

import {
  usePostV1AccountsDeleteConfirm,
  usePostV1MeEmailChangeConfirm,
  usePostV1MePasswordChangeConfirm,
} from "@patch-careers/api-client";
import { logout } from "@patch-careers/auth";
import { OTPInput, Text } from "@patch-careers/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { useSet, type VerifyFlow } from "@/features/settings";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useI18n } from "@/providers/i18n-provider";

export default function VerifyCodeScreen(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string; email?: string }>();
  const flow: VerifyFlow =
    params.flow === "password" ? "password" : params.flow === "delete" ? "delete" : "email";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const emailConfirm = usePostV1MeEmailChangeConfirm();
  const passwordConfirm = usePostV1MePasswordChangeConfirm();
  const deleteConfirm = usePostV1AccountsDeleteConfirm();

  const onComplete = (final: string): void => {
    setError("");
    // All three flows end the session (email/password invalidate it; delete
    // erases the account), so on success we sign out and return to login.
    const onSuccess = async (): Promise<void> => {
      await logout();
      router.replace(AUTH_SIGN_IN_ROUTE);
    };
    const onError = (): void => setError(t("settings.account.verifyCode.invalid"));
    const confirm =
      flow === "email" ? emailConfirm : flow === "password" ? passwordConfirm : deleteConfirm;
    confirm.mutate({ data: { code: final } }, { onSuccess: () => void onSuccess(), onError });
  };

  const intro =
    flow === "email"
      ? t("settings.account.verifyCode.introEmail", { email: params.email ?? "" })
      : flow === "password"
        ? t("settings.account.verifyCode.introPassword")
        : t("settings.account.verifyCode.introDelete");

  return (
    <SettingsScreenShell title={t("settings.account.verifyCode.title")}>
      <Text style={styles.intro}>{intro}</Text>
      <OTPInput value={code} onChangeText={setCode} onComplete={onComplete} autoFocus />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </SettingsScreenShell>
  );
}
