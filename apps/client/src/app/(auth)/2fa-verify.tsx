/**
 * 2FA verification screen (D104) — second leg of a sign-in that the
 * backend gated with `twoFactorRequired: true`.
 *
 * Two input modes:
 *   - OTPInput (6-digit TOTP from the authenticator app, default)
 *   - Backup-code text input (single-use fallback)
 *
 * On success the bearer pair is persisted by `verifyTwoFactor()` and we
 * call `bootstrap()` + replace into /(tabs)/jobs.
 */

import { bootstrap, exchangeSessionForTokens, verifyTwoFactor } from "@patch-careers/auth";
import { palette } from "@patch-careers/tokens";
import { Button, FormField, OTPInput, Text, useToast, XStack, YStack } from "@patch-careers/ui";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { AuthScreenLayout } from "../../components/AuthScreenLayout";
import { useTranslator } from "../../providers/I18nProvider";

export default function TwoFactorVerifyScreen(): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ userId?: string }>();

  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitCode(value: string) {
    const userId = params.userId;
    if (!userId) {
      toast.show({ title: t("auth.loginFailed"), intent: "danger" });
      router.replace("/(auth)/sign-in");
      return;
    }
    setSubmitting(true);
    try {
      const result = await verifyTwoFactor(userId, value);
      if (result.sessionExchangeId) {
        await exchangeSessionForTokens(result.sessionExchangeId);
      }
      await bootstrap().catch(() => undefined);
      router.replace("/(tabs)/jobs");
    } catch {
      toast.show({ title: t("auth.loginFailed"), intent: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleOtpComplete(value: string) {
    void submitCode(value);
  }

  async function handleBackupSubmit() {
    if (backupCode.trim().length === 0) return;
    await submitCode(backupCode.trim());
  }

  return (
    <AuthScreenLayout
      title={mode === "totp" ? t("auth.twoFaTitle") : t("auth.twoFaBackupTitle")}
      subtitle={mode === "totp" ? t("auth.twoFaIntro") : t("auth.twoFaBackupIntro")}
    >
      <YStack gap={16} alignItems="center">
        {mode === "totp" ? (
          <OTPInput value={code} onChangeText={setCode} onComplete={handleOtpComplete} autoFocus />
        ) : (
          <YStack width="100%" gap={12}>
            <FormField
              label={t("auth.twoFaBackupTitle")}
              placeholder={t("auth.twoFaBackupPlaceholder")}
              autoCapitalize="characters"
              value={backupCode}
              onChangeText={setBackupCode}
              testID="twofa.backupCode"
            />
            <Button
              intent="accent"
              size="lg"
              loading={submitting}
              onPress={handleBackupSubmit}
              testID="twofa.backupSubmit"
            >
              {t("common.submit")}
            </Button>
          </YStack>
        )}

        <Pressable
          onPress={() => setMode(mode === "totp" ? "backup" : "totp")}
          accessibilityRole="button"
          style={styles.toggleButton}
          testID="twofa.toggleMode"
        >
          <Text preset="caption" color={palette.blue[600]}>
            {mode === "totp" ? t("auth.twoFaUseBackup") : t("auth.twoFaUseTotp")}
          </Text>
        </Pressable>

        {submitting && mode === "totp" ? (
          <Text preset="caption" color="$gray10">
            {t("common.loading")}
          </Text>
        ) : null}

        <XStack justifyContent="center" gap={4} marginTop={8}>
          <Link href="/(auth)/sign-in" accessibilityRole="link" testID="twofa.backToSignIn">
            <Text preset="caption" color={palette.blue[600]}>
              {t("common.back")}
            </Text>
          </Link>
        </XStack>
      </YStack>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    padding: 8,
  },
});
