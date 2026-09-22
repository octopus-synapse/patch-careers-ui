/**
 * Verify step of the unified auth flow (e-mail → code → password).
 * It serves both new e-mails and accounts awaiting verification. The
 * confirmation token authorizes the next step for the identified e-mail.
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
import { authDialogPalette } from "@patch-careers/tokens";
import { Text, YStack } from "@patch-careers/ui";
import {
  type AuthMascotController,
  editorialFonts,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { EditorialOtp, type EditorialOtpState } from "@/components/auth/editorial-otp";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { AuthStepTitle } from "./auth-step-title";

const RESEND_COOLDOWN_S = 60;
const ERROR_RESET_MS = 1100;
const ADVANCE_AFTER_MS = 700;
const OTP_CELLS = 6;

const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

type Status =
  | "none"
  | "sending"
  | "loading"
  | "error"
  | "sendError"
  | "rateLimited"
  | "sent"
  | "done";

export function VerifyStep({
  mascot,
  email,
  onChangeEmail,
  onVerified,
}: {
  readonly mascot: AuthMascotController;
  readonly email: string;
  readonly onChangeEmail: () => void;
  /** Success — carry the registration token into the create-password step. */
  readonly onVerified: (registrationToken: string) => void;
}): ReactElement {
  const { t } = useAuthScreen();
  const palette = useEditorialPalette();
  const dialogPalette = authDialogPalette[useThemeName()];
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
      const requestedAt = Date.now();
      setLastResendAt(requestedAt);
      setNow(requestedAt);
      setCode("");
      setStatus("sending");
      try {
        const response = await startPreSignupVerification({ email });
        setTestCode(response.testCode ?? null);
        setStatus(announce ? "sent" : "none");
      } catch (error) {
        setTestCode(null);
        const rateLimited =
          typeof error === "object" && error !== null && "status" in error && error.status === 429;
        setLastResendAt(null);
        setStatus(rateLimited ? "rateLimited" : "sendError");
      }
    },
    [canResend, email],
  );

  // Entering the step sends the first code after identification.
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
        : status === "error" || status === "sendError" || status === "rateLimited"
          ? "error"
          : "idle";

  const statusMessage =
    status === "loading"
      ? t("auth.verifyChecking")
      : status === "error"
        ? t("auth.verifyInvalidToken")
        : status === "sendError"
          ? t("auth.verifySendFailed")
          : status === "rateLimited"
            ? t("auth.verifyRateLimited")
            : status === "sent"
              ? t("auth.verifyCodeResent")
              : status === "done"
                ? t("auth.verifiedTitle")
                : "";
  const codeNotSent = status === "sendError" || status === "rateLimited";
  const waitingForCode = status === "sending" || codeNotSent;

  return (
    <YStack gap={16} paddingVertical={22}>
      <AuthStepTitle variant="plan" centered>
        {codeNotSent ? t("auth.verifySendProblemTitle") : t("auth.verifyTitle")}
      </AuthStepTitle>
      <Text
        fontFamily={editorialFonts.sans}
        fontSize={13}
        lineHeight={19}
        textAlign="center"
        color={dialogPalette.muted}
      >
        {status === "sending"
          ? t("auth.verifySendingIntro")
          : codeNotSent
            ? t("auth.verifySendProblemIntro")
            : t("auth.verifyIntroShort")}
      </Text>
      <Text
        fontFamily={editorialFonts.mono}
        fontSize={11}
        fontWeight="500"
        textAlign="center"
        color={dialogPalette.brand}
      >
        {maskEmail(email)}
      </Text>
      <Text
        onPress={onChangeEmail}
        accessibilityRole="button"
        cursor="pointer"
        fontFamily={editorialFonts.sans}
        fontSize={11}
        fontWeight="600"
        textAlign="center"
        color={dialogPalette.brandMuted}
        textDecorationLine="underline"
        testID="authDialog.changeEmailVerify"
      >
        {t("auth.verifyChangeEmail")}
      </Text>

      {waitingForCode ? (
        <YStack minHeight={96} alignItems="center" justifyContent="center" paddingHorizontal={18}>
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={13}
            lineHeight={20}
            textAlign="center"
            color={codeNotSent ? palette.danger : dialogPalette.muted}
            accessibilityLiveRegion="polite"
          >
            {status === "sending" ? t("auth.verifySending") : statusMessage}
          </Text>
        </YStack>
      ) : (
        <>
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
                fontFamily={editorialFonts.sans}
                color={status === "error" ? palette.danger : dialogPalette.muted}
                accessibilityLiveRegion="polite"
              >
                {statusMessage}
              </Text>
            ) : null}
          </YStack>
        </>
      )}

      <YStack alignItems="center" minHeight={24}>
        {status === "sending" ? null : canResend ? (
          <Text
            onPress={() => void requestCode(true)}
            accessibilityRole="button"
            cursor="pointer"
            fontFamily={editorialFonts.sans}
            fontSize={13}
            fontWeight="600"
            color={dialogPalette.brandMuted}
            testID="authDialog.resend"
          >
            {t("auth.verifyResend")}
          </Text>
        ) : (
          <Text fontFamily={editorialFonts.sans} fontSize={13} color={dialogPalette.muted}>
            {t("auth.verifyResendPrefix")}{" "}
            <Text fontFamily={editorialFonts.mono} fontSize={12.5} color={dialogPalette.brand}>
              {mmss(remaining)}
            </Text>
          </Text>
        )}
      </YStack>

      {testCode ? (
        <Text
          fontFamily={editorialFonts.sans}
          fontSize={12}
          textAlign="center"
          color={dialogPalette.muted}
          testID="authDialog.testCode"
        >
          {t("app.verifyEmail.testCodeSent", { code: testCode })}
        </Text>
      ) : null}
    </YStack>
  );
}
