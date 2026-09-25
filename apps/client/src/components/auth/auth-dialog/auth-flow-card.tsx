import { Ionicons } from "@expo/vector-icons";
import { completeUnverifiedAccount, signup } from "@patch-careers/api-client";
import { login } from "@patch-careers/auth";
import { authDialogPalette } from "@patch-careers/tokens";
import { Text, useToast, XStack, YStack } from "@patch-careers/ui";
import {
  BrandMark,
  editorialFonts,
  useAuthMascot,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { type ReactElement, useEffect, useState } from "react";
import { Platform, Pressable } from "react-native";
import { PRIVACY_VERSION, TOS_VERSION } from "@/components/auth/consent-versions";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { extractApiErrorMessages } from "@/components/auth/validation";
import type { BillingOfferCode } from "@/features/billing";
import { AUTH_FLOW_RESET_EVENT } from "@/navigation/auth-flow-reset";
import { useI18n } from "@/providers/i18n-provider";
import { AuthFlowPanel } from "./auth-flow-panel";
import type { AuthBranch } from "./branch-for-identity";
import { ChoosePlanStep, type SignupPlan } from "./choose-plan-step";
import { CreateAccountStep } from "./create-account-step";
import { EmailStep } from "./email-step";
import { ForgotPasswordStep } from "./forgot-password-step";
import { SignInStep } from "./sign-in-step";
import { UnavailableStep } from "./unavailable-step";
import { VerifyStep } from "./verify-step";

type Step =
  | "email"
  | "signIn"
  | "verifyEmail"
  | "choosePlan"
  | "createAccount"
  | "unavailable"
  | "forgotPassword";
type AccountMode = "new" | "resume";

/** The same steps and state machine serve the landing modal and /auth. */
export function AuthFlowCard({
  onClose,
  variant = "dialog",
  initialStep = "email",
  onPlanStepChange,
}: {
  readonly onClose?: () => void;
  readonly variant?: "dialog" | "page";
  readonly initialStep?: "email" | "forgotPassword";
  readonly onPlanStepChange?: (isPlanStep: boolean) => void;
}): ReactElement {
  const { t, locale } = useI18n();
  const palette = useEditorialPalette();
  const dialogPalette = authDialogPalette[useThemeName()];
  const toast = useToast();
  const router = useRouter();
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();
  const isPage = variant === "page";
  const mascot = useAuthMascot();
  const [step, setStep] = useState<Step>(initialStep);
  const [mode, setMode] = useState<AccountMode>("new");
  const [email, setEmail] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [pendingKeepSignedIn, setPendingKeepSignedIn] = useState(false);

  useEffect(() => {
    onPlanStepChange?.(step === "choosePlan");
  }, [onPlanStepChange, step]);

  useEffect(() => {
    if (!isPage || typeof window === "undefined") return;
    const reset = (): void => {
      mascot.reset();
      setStep("email");
      setMode("new");
      setEmail("");
      setRegistrationToken("");
      setPendingPassword("");
      setPendingKeepSignedIn(false);
    };
    window.addEventListener(AUTH_FLOW_RESET_EVENT, reset);
    return () => window.removeEventListener(AUTH_FLOW_RESET_EVENT, reset);
  }, [isPage, mascot]);

  useEffect(() => {
    if (!isPage || step !== "forgotPassword" || Platform.OS !== "web") return;
    // Initial guest-locale navigation can rewrite /auth?step=... to /en/auth
    // after the card mounts. Restore the query so a reload keeps this step.
    const handle = setTimeout(() => {
      if (window.location.search) return;
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}?step=forgot-password`,
      );
    }, 500);
    return () => clearTimeout(handle);
  }, [isPage, step]);

  const toEmailStep = (): void => {
    mascot.reset();
    setRegistrationToken("");
    setPendingPassword("");
    setStep("email");
  };

  const toForgotPassword = (): void => {
    if (isPage) router.setParams({ step: "forgot-password" });
    setStep("forgotPassword");
  };

  const fromForgotPassword = (): void => {
    if (isPage) router.setParams({ step: undefined });
    setStep(email ? "signIn" : "email");
  };

  const onBranch = (branch: AuthBranch, identifiedEmail: string): void => {
    setEmail(identifiedEmail);
    setRegistrationToken("");
    setPendingPassword("");
    if (branch === "signIn" || branch === "unavailable") {
      setStep(branch);
      return;
    }
    setMode(branch === "resumeUnverified" ? "resume" : "new");
    setStep("verifyEmail");
  };

  const finalizeAccount = async (
    plan: SignupPlan,
    password: string,
    keepSignedIn: boolean,
    offerCode?: BillingOfferCode,
  ): Promise<void> => {
    await run(async () => {
      let accountCompleted = false;
      try {
        const payload = {
          email,
          password,
          acceptedTosVersion: TOS_VERSION,
          acceptedPrivacyVersion: PRIVACY_VERSION,
          emailVerificationToken: registrationToken,
        };
        if (mode === "resume") {
          await completeUnverifiedAccount(payload);
        } else {
          await signup(payload);
        }
        accountCompleted = true;

        let sessionExchangeId: string | undefined;
        try {
          const result = await login(email, password, { keepSignedIn });
          if (result.twoFactorRequired) {
            router.replace({
              pathname: "/(auth)/2fa-verify",
              params: { userId: result.userId, keepSignedIn: keepSignedIn ? "1" : "0" },
            });
            return;
          }
          sessionExchangeId = result.sessionExchangeId ?? undefined;
        } catch {
          setStep("signIn");
          return;
        }

        setPendingPassword("");
        mascot.celebrate({ settle: true });
        await finishAuthentication({
          ...(sessionExchangeId ? { sessionExchangeId } : {}),
          ...(!isPage
            ? { destination: { pathname: "/onboarding", params: { choosePlan: "1" } } as const }
            : plan === "free"
              ? {}
              : {
                  destination: {
                    pathname: "/go",
                    params: { startCheckout: plan, ...(offerCode ? { offerCode } : {}) },
                  },
                }),
        });
      } catch (err) {
        mascot.grimace();
        if (accountCompleted) {
          setStep("signIn");
          return;
        }

        const messages = extractApiErrorMessages(err, locale, t, "auth.signupFailed");
        if (messages.fields.email) {
          toEmailStep();
          toast.show({ title: messages.fields.email, intent: "danger" });
          return;
        }
        if (messages.fields.password) {
          setStep("createAccount");
          toast.show({ title: messages.fields.password, intent: "danger" });
          return;
        }
        if (messages.toast) toast.show({ title: messages.toast, intent: "danger" });
      }
    });
  };

  const header = !isPage ? (
    <YStack position="relative" width="100%">
      <XStack alignItems="center" gap={9}>
        <BrandMark size={29} />
        <Text
          fontFamily={editorialFonts.sans}
          fontSize={35}
          lineHeight={37}
          fontWeight="800"
          letterSpacing={-2.2}
          color={palette.ink}
        >
          patch<Text color={dialogPalette.brandMuted}>.</Text>
        </Text>
      </XStack>
      {onClose && !isPage ? (
        <YStack position="absolute" top={-7} right={-8} zIndex={2}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("landing.nav.close")}
            onPress={onClose}
            testID="authDialog.close"
          >
            <YStack
              width={34}
              height={34}
              borderRadius={999}
              alignItems="center"
              justifyContent="center"
              hoverStyle={{ backgroundColor: palette.hairline }}
            >
              <Ionicons name="close" size={22} color={palette.muted} />
            </YStack>
          </Pressable>
        </YStack>
      ) : null}
    </YStack>
  ) : null;

  const content = (
    <YStack
      width="100%"
      maxWidth={step === "choosePlan" ? undefined : 500}
      alignSelf="center"
      {...(step === "choosePlan" ? { height: "100%", minHeight: 0 } : {})}
    >
      {step === "email" ? (
        <EmailStep mascot={mascot} initialEmail={email} onBranch={onBranch} isPage={isPage} />
      ) : null}
      {step === "signIn" ? (
        <SignInStep
          mascot={mascot}
          email={email}
          onChangeEmail={toEmailStep}
          onForgotPassword={toForgotPassword}
        />
      ) : null}
      {step === "forgotPassword" ? (
        <ForgotPasswordStep
          initialEmail={email}
          onEmailAccepted={setEmail}
          onBack={fromForgotPassword}
          isPage={isPage}
        />
      ) : null}
      {step === "verifyEmail" ? (
        <VerifyStep
          mascot={mascot}
          email={email}
          onChangeEmail={toEmailStep}
          onVerified={(token) => {
            setRegistrationToken(token);
            setStep("createAccount");
          }}
        />
      ) : null}
      {step === "choosePlan" ? (
        <ChoosePlanStep
          requireAccountConsent
          submitting={submitting}
          onBack={() => setStep("createAccount")}
          onContinue={(plan, offerCode) =>
            finalizeAccount(plan, pendingPassword, pendingKeepSignedIn, offerCode)
          }
        />
      ) : null}
      {step === "createAccount" ? (
        <CreateAccountStep
          mascot={mascot}
          email={email}
          mode={mode}
          initialPassword={pendingPassword}
          deferAccountCreation={isPage}
          submitting={submitting}
          onChangeEmail={toEmailStep}
          onContinue={(password, keepSignedIn) => {
            setPendingPassword(password);
            setPendingKeepSignedIn(keepSignedIn);
            if (isPage) {
              setStep("choosePlan");
              return;
            }
            return finalizeAccount("free", password, keepSignedIn);
          }}
        />
      ) : null}
      {step === "unavailable" ? (
        <UnavailableStep mascot={mascot} email={email} onChangeEmail={toEmailStep} />
      ) : null}
    </YStack>
  );

  return (
    <AuthFlowPanel
      variant={variant}
      isPlanStep={step === "choosePlan"}
      mobileTransparent={isPage}
      header={header}
    >
      {content}
    </AuthFlowPanel>
  );
}
