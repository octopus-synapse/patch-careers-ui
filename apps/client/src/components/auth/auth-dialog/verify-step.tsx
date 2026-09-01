/**
 * Verify step of the unified auth dialog — PRE-signup (identifier-first:
 * e-mail → code → password). Entering the step fires
 * `POST /v1/auth/email-verification/start` (public — no account exists
 * yet); the sixth typed digit submits to `/confirm`, whose success hands
 * back the registration token the create-password step sends with the
 * signup so the account is born verified.
 *
 * Shares the verify-email screen's parts: `EditorialOtp` cells, the 60s
 * resend cooldown via `cooldownSecondsRemaining`, the same status-line
 * pattern (no toasts).
 */
import {
  confirmPreSignupVerification,
  startPreSignupVerification,
} from "@patch-careers/api-client";
import { cooldownSecondsRemaining, maskEmail } from "@patch-careers/auth";
import { Text, YStack } from "@patch-careers/ui";
import {
  type AuthMascotController,
  editorialFonts,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { EditorialOtp, type EditorialOtpState } from "@/components/auth/editorial-otp";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";

const RESEND_COOLDOWN_S = 60;
const ERROR_RESET_MS = 1100;
const ADVANCE_AFTER_MS = 700;
const OTP_CELLS = 6;

const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

type Status = "none" | "loading" | "error" | "sent" | "done";

export function VerifyStep({
  mascot,
  email,
  onVerified,
}: {
  readonly mascot: AuthMascotController;
  readonly email: string;
  /** Success — carry the registration token into the create-password step. */
  readonly onVerified: (registrationToken: string) => void;
}): ReactElement {
  const { t } = useAuthScreen();
  const palette = useEditorialPalette();
  const { run } = useSubmit();

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("none");
  const [testCode, setTestCode] = useState<string | null>(null);
  const [lastResendAt, setLastResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const autoSendRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const remaining = cooldownSecondsRemaining(lastResendAt, RESEND_COOLDOWN_S, now);
  const canResend = remaining === 0;

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (canResend || status === "done") return;
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, [canResend, status]);

  const schedule = useCallback((fn: () => void, at: number) => {
    timersRef.current.push(setTimeout(fn, at));
  }, []);

  // The mascot settles in its sealed rest and follows the cells.
  const sealedOnceRef = useRef(false);
  useEffect(() => {
    if (sealedOnceRef.current) return;
    sealedOnceRef.current = true;
    mascot.seal();
  }, [mascot]);
  useEffect(() => {
    if (status === "done") return;
    mascot.lookAt(code.length === 0 ? 0 : Math.min(1, (code.length - 0.5) / OTP_CELLS), 8);
  }, [code.length, status, mascot]);

  const requestCode = useCallback(
    async (announce: boolean) => {
      if (!canResend) return;
      setLastResendAt(Date.now());
      setCode("");
      try {
        const response = await startPreSignupVerification({ email });
        setTestCode(response.testCode ?? null);
        if (announce) setStatus("sent");
      } catch {
        setTestCode(null);
        // Ignore — user can retry after cooldown (the server enforces its own).
      }
    },
    [canResend, email],
  );

  // Entering the step sends the first code (identify said the e-mail is free).
  useEffect(() => {
    if (autoSendRef.current) return;
    autoSendRef.current = true;
    void requestCode(false);
  }, [requestCode]);

  const submitCode = useCallback(
    async (typed: string) => {
      await run(async () => {
        setStatus("loading");
        try {
          const result = await confirmPreSignupVerification({ email, code: typed });
          setStatus("done");
          mascot.beam();
          schedule(() => onVerified(result.registrationToken), ADVANCE_AFTER_MS);
        } catch {
          setStatus("error");
          mascot.grimace();
          schedule(() => {
            setCode("");
            setStatus("none");
            mascot.seal();
          }, ERROR_RESET_MS);
        }
      });
    },
    [run, email, mascot, schedule, onVerified],
  );

  // The sixth digit IS the submit.
  useEffect(() => {
    if (status !== "none" || code.length !== OTP_CELLS) return;
    const handle = setTimeout(() => void submitCode(code), 200);
    return () => clearTimeout(handle);
  }, [code, status, submitCode]);

  const otpState: EditorialOtpState =
    status === "done"
      ? "done"
      : status === "loading"
        ? "loading"
        : status === "error"
          ? "error"
          : "idle";

  const statusMessage =
    status === "loading"
      ? t("auth.verifyChecking")
      : status === "error"
        ? t("auth.verifyInvalidToken")
        : status === "sent"
          ? t("auth.verifyCodeResent")
          : status === "done"
            ? t("auth.verifiedTitle")
            : "";

  return (
    <YStack gap={16} paddingVertical={22}>
      <Text
        fontFamily={editorialFonts.serif}
        fontSize={27}
        lineHeight={32}
        letterSpacing={-0.4}
        textAlign="center"
        color={palette.ink}
      >
        {t("auth.verifyTitle")}
      </Text>
      <Text fontSize={12.5} lineHeight={18} textAlign="center" color={palette.muted}>
        {t("auth.verifyIntroShort")}
      </Text>
      <Text
        fontFamily={editorialFonts.mono}
        fontSize={11.5}
        textAlign="center"
        color={palette.body}
      >
        {maskEmail(email)}
      </Text>

      <YStack alignItems="center" minHeight={96} justifyContent="center">
        <EditorialOtp
          value={code}
          onChangeText={(next) => {
            setCode(next);
            if (status === "sent" || status === "error") setStatus("none");
          }}
          state={otpState}
          accessibilityLabel={t("auth.verifyCodeLabel")}
          autoFocus
          testID="authDialog.code"
        />
      </YStack>

      <YStack minHeight={18} alignItems="center">
        {statusMessage ? (
          <Text
            fontSize={12.5}
            color={status === "error" ? palette.danger : palette.muted}
            accessibilityLiveRegion="polite"
          >
            {statusMessage}
          </Text>
        ) : null}
      </YStack>

      <YStack alignItems="center" minHeight={24}>
        {canResend ? (
          <Text
            onPress={() => void requestCode(true)}
            accessibilityRole="button"
            cursor="pointer"
            fontSize={13}
            fontWeight="600"
            color={palette.accent}
            testID="authDialog.resend"
          >
            {t("auth.verifyResend")}
          </Text>
        ) : (
          <Text fontSize={13} color={palette.muted}>
            {t("auth.verifyResendPrefix")}{" "}
            <Text fontFamily={editorialFonts.mono} fontSize={12.5} color={palette.subtle}>
              {mmss(remaining)}
            </Text>
          </Text>
        )}
      </YStack>

      {testCode ? (
        <Text fontSize={12} textAlign="center" color={palette.muted} testID="authDialog.testCode">
          {t("app.verifyEmail.testCodeSent", { code: testCode })}
        </Text>
      ) : null}
    </YStack>
  );
}
