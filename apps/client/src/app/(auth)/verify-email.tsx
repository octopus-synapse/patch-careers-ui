/**
 * Verify email screen (D101): OTPInput 6 dígitos com auto-submit, iOS
 * Auto-Fill via `textContentType="oneTimeCode"`, botão Reenviar com
 * cooldown.
 *
 * Two paths into success:
 *   1. User types the 6-digit code → POST /v1/auth/verify with the code
 *      as `token` → toast + navigate to the post-auth home.
 *   2. User taps the email link → universal link `/verify-email?token=...`
 *      → useEffect detects the token param, auto-calls verify.
 *
 * D102: after success → /(onboarding) when the hydrated user still needs
 * onboarding; otherwise into the tabbed shell.
 */

import { postV1AuthEmailVerificationSend, verify as verifyApi } from "@patch-careers/api-client";
import { bootstrap, cooldownSecondsRemaining, maskEmail } from "@patch-careers/auth";
import { palette } from "@patch-careers/tokens";
import { OTPInput, Text, useToast, XStack, YStack } from "@patch-careers/ui";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { AuthScreenLayout } from "../../components/AuthScreenLayout";
import { getCurrentAuthenticatedRoute } from "../../navigation/authRedirect";
import { useTranslator } from "../../providers/I18nProvider";

const RESEND_COOLDOWN_S = 60;

export default function VerifyEmailScreen(): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const email = params.email ?? "";
  const [code, setCode] = useState("");
  const [testCode, setTestCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResendAt, setLastResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const autoSubmitTokenRef = useRef(false);
  const autoSendCodeRef = useRef(false);

  const remaining = cooldownSecondsRemaining(lastResendAt, RESEND_COOLDOWN_S, now);
  const canResend = remaining === 0;

  // Tick the cooldown so the UI reflects elapsed time without manual
  // refresh. We only tick while the cooldown is active to avoid a
  // perpetual setInterval.
  useEffect(() => {
    if (canResend) return;
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, [canResend]);

  const submitToken = useCallback(
    async (token: string) => {
      setSubmitting(true);
      try {
        await verifyApi({ token });
        await bootstrap().catch(() => undefined);
        toast.show({ title: t("auth.verifySuccess"), intent: "success" });
        router.replace(getCurrentAuthenticatedRoute());
      } catch {
        toast.show({ title: t("auth.resetInvalidToken"), intent: "danger" });
      } finally {
        setSubmitting(false);
      }
    },
    [router, t, toast],
  );

  // Auto-submit when the deep-link path provides a token directly.
  useEffect(() => {
    if (autoSubmitTokenRef.current) return;
    const token = params.token;
    if (token && token.length > 0) {
      autoSubmitTokenRef.current = true;
      void submitToken(token);
    }
  }, [params.token, submitToken]);

  const requestVerificationCode = useCallback(async () => {
    if (!canResend) return;
    setLastResendAt(Date.now());
    try {
      const response = await postV1AuthEmailVerificationSend();
      setTestCode(response.testCode ?? null);
    } catch {
      setTestCode(null);
      // Ignore — user can retry after cooldown.
    }
  }, [canResend]);

  // Landing here after sign-up should trigger the first verification email.
  // In dev, the backend may also return the test code to display on-screen.
  useEffect(() => {
    if (autoSendCodeRef.current || params.token) return;
    autoSendCodeRef.current = true;
    void requestVerificationCode();
  }, [params.token, requestVerificationCode]);

  async function handleResend() {
    await requestVerificationCode();
  }

  function handleComplete(value: string) {
    void submitToken(value);
  }

  return (
    <AuthScreenLayout
      title={t("auth.verifyTitle")}
      subtitle={t("auth.verifyIntro", { email: email ? maskEmail(email) : "" })}
    >
      <YStack gap={16} alignItems="center">
        <OTPInput value={code} onChangeText={setCode} onComplete={handleComplete} autoFocus />
        <Pressable
          onPress={handleResend}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canResend }}
          disabled={!canResend}
          style={styles.resendButton}
          testID="verify.resend"
        >
          <Text preset="caption" color={canResend ? palette.blue[600] : palette.gray[500]}>
            {canResend ? t("auth.verifyResend") : t("auth.verifyResendIn", { seconds: remaining })}
          </Text>
        </Pressable>
        {submitting ? (
          <Text preset="caption" color="$gray10">
            {t("common.loading")}
          </Text>
        ) : null}
        {testCode ? (
          <Text preset="caption" color="$gray10" testID="verify.testCode">
            Codigo enviado (teste): {testCode}
          </Text>
        ) : null}
        <XStack justifyContent="center" gap={4} marginTop={8}>
          <Link href="/(auth)/sign-in" accessibilityRole="link" testID="verify.backToSignIn">
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
  resendButton: {
    padding: 8,
  },
});
