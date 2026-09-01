/**
 * AuthDialog — the unified "sign in or create account" modal on web,
 * opened from the landing's `PublicNavBar` (Airbnb pattern). One e-mail
 * field decides the branch via `POST /v1/auth/identify`; each later step
 * reuses the corresponding screen's logic (sign-in submit flow, sign-up
 * consent gate, verify cells), so the standalone `(auth)` routes and this
 * dialog stay behaviourally identical.
 *
 * The mascot perches on the card throughout (`AuthMascotCard`) — it
 * lives only here while the dialog is open, and steps drive it exactly
 * like their screen counterparts. Same overlay construction as the
 * nav bar's PreferencesModal: fixed scrim above everything, Escape and
 * scrim-click dismiss, panel clicks don't propagate.
 */

import { Ionicons } from "@expo/vector-icons";
import { editorialOverlays } from "@patch-careers/tokens";
import { YStack } from "@patch-careers/ui";
import { AuthMascotCard, useAuthMascot, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useResolvedScheme } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";
import type { AuthBranch } from "./branch-for-identity";
import { CreateAccountStep } from "./create-account-step";
import { EmailStep } from "./email-step";
import { OauthOnlyStep } from "./oauth-only-step";
import { SignInStep } from "./sign-in-step";
import { VerifyStep } from "./verify-step";

const OVERLAY_Z_INDEX = 300;
const PANEL_WIDTH = 460;

type Step = "email" | "signIn" | "verifyEmail" | "createAccount" | "oauthOnly";

// Identifier-first signup order: verify the e-mail BEFORE asking for a
// password (demo-approved choreography); the verify step's registration
// token then lets signup create the account already verified.
const STEP_FOR_BRANCH: Record<AuthBranch, Step> = {
  signIn: "signIn",
  signUp: "verifyEmail",
  oauthOnly: "oauthOnly",
};

export function AuthDialog({ onClose }: { readonly onClose: () => void }): ReactElement {
  const { t } = useI18n();
  const resolved = useResolvedScheme();
  const palette = useEditorialPalette();
  const { width, height } = useWindowDimensions();
  const mascot = useAuthMascot();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toEmailStep = (): void => {
    mascot.reset();
    setStep("email");
  };

  return (
    <View
      style={{
        // Escapes the landing's stacking context on purpose — same
        // construction as the nav bar's PreferencesModal. RNW passes
        // `fixed` through.
        position: "fixed" as never,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: OVERLAY_Z_INDEX,
        backgroundColor: editorialOverlays[resolved].scrimModal,
        alignItems: "center",
        justifyContent: "center",
      }}
      onStartShouldSetResponder={() => true}
      onResponderRelease={onClose}
      {...{ dataSet: { landingOverlay: "" } }}
    >
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => undefined}
        style={{ width: Math.min(PANEL_WIDTH, width * 0.92), maxHeight: height * 0.94 }}
      >
        <AuthMascotCard mascot={mascot} animateIn>
          <YStack position="relative">
            <YStack position="absolute" top={-14} right={-6} zIndex={2}>
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
                  hoverStyle={{ backgroundColor: palette.surface }}
                >
                  <Ionicons name="close" size={17} color={palette.muted} />
                </YStack>
              </Pressable>
            </YStack>

            {step === "email" ? (
              <EmailStep
                mascot={mascot}
                initialEmail={email}
                onBranch={(branch, identifiedEmail) => {
                  setEmail(identifiedEmail);
                  setStep(STEP_FOR_BRANCH[branch]);
                }}
              />
            ) : null}
            {step === "signIn" ? (
              <SignInStep mascot={mascot} email={email} onChangeEmail={toEmailStep} />
            ) : null}
            {step === "verifyEmail" ? (
              <VerifyStep
                mascot={mascot}
                email={email}
                onVerified={(token) => {
                  setRegistrationToken(token);
                  setStep("createAccount");
                }}
              />
            ) : null}
            {step === "createAccount" ? (
              <CreateAccountStep
                mascot={mascot}
                email={email}
                registrationToken={registrationToken}
                onChangeEmail={toEmailStep}
              />
            ) : null}
            {step === "oauthOnly" ? (
              <OauthOnlyStep mascot={mascot} email={email} onChangeEmail={toEmailStep} />
            ) : null}
          </YStack>
        </AuthMascotCard>
      </View>
    </View>
  );
}
