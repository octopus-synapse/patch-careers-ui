/**
 * Verify-email screen (D101) — "Editorial Calm" DS. 6-digit OTP with
 * auto-submit + iOS Auto-Fill, resend with cooldown.
 *
 * Two paths into success:
 *   1. User types the 6-digit code → POST /v1/auth/verify → success toast
 *      → `finishAuthentication()` (bootstrap + route to post-auth home).
 *   2. User taps the email link → `/verify-email?token=...` → the effect
 *      detects the token param and auto-submits.
 */

import { postV1AuthEmailVerificationSend, verify as verifyApi } from "@patch-careers/api-client";
import { cooldownSecondsRemaining, maskEmail } from "@patch-careers/auth";
import { OTPInput, Text } from "@patch-careers/ui";
import { AuthShell, CaptionButton, IntroBlock } from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { BackToSignInLink } from "@/components/auth/back-to-sign-in-link";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useSubmit } from "@/components/auth/hooks/use-submit";

const RESEND_COOLDOWN_S = 60;

export default function VerifyEmailScreen(): ReactElement {
  const { t, toast } = useAuthScreen();
  const { finishAuthentication } = useCompleteAuth();
  const { run } = useSubmit();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const email = params.email ?? "";
  const [code, setCode] = useState("");
  const [testCode, setTestCode] = useState<string | null>(null);
  const [lastResendAt, setLastResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const autoSubmitTokenRef = useRef(false);
  const autoSendCodeRef = useRef(false);

  const remaining = cooldownSecondsRemaining(lastResendAt, RESEND_COOLDOWN_S, now);
  const canResend = remaining === 0;

  // Tick the cooldown only while active (avoid a perpetual interval).
  useEffect(() => {
    if (canResend) return;
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, [canResend]);

  const submitToken = useCallback(
    async (token: string) => {
      await run(async () => {
        try {
          await verifyApi({ token });
          toast.show({ title: t("auth.verifySuccess"), intent: "success" });
          await finishAuthentication();
        } catch {
          toast.show({ title: t("auth.verifyInvalidToken"), intent: "danger" });
        }
      });
    },
    [run, finishAuthentication, t, toast],
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

  // Landing here after sign-up triggers the first verification email.
  useEffect(() => {
    if (autoSendCodeRef.current || params.token) return;
    autoSendCodeRef.current = true;
    void requestVerificationCode();
  }, [params.token, requestVerificationCode]);

  return (
    <AuthShell>
      <IntroBlock
        emphasis={t("auth.verifyTitle")}
        subtitle={t("auth.verifyIntro", { email: email ? maskEmail(email) : "" })}
      />
      <View style={{ gap: 20, alignItems: "center" }}>
        <OTPInput
          value={code}
          onChangeText={setCode}
          onComplete={(v) => void submitToken(v)}
          autoFocus
        />
        <CaptionButton
          label={
            canResend ? t("auth.verifyResend") : t("auth.verifyResendIn", { seconds: remaining })
          }
          onPress={() => void requestVerificationCode()}
          disabled={!canResend}
          testID="verify.resend"
        />
        {testCode ? (
          <Text preset="caption" color="$gray10" testID="verify.testCode">
            {`Codigo enviado (teste): ${testCode}`}
          </Text>
        ) : null}
        <BackToSignInLink testID="verify.backToSignIn" />
      </View>
    </AuthShell>
  );
}
