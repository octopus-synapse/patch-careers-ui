/**
 * Sign-up screen (D95-D98) — "Editorial Calm" refinement.
 *
 * Single-page form: email + password (with refined 4-segment strength
 * meter + check chips) + consent checkbox with inline Terms / Privacy
 * links. Same chrome (AuthShell + IntroBlock + PrimaryAction) as
 * sign-in for visual continuity.
 *
 * On success → `/verify-email` with the email param (next screen
 * masks it for the OTP prompt).
 */

import { signup } from "@patch-careers/api-client";
import {
  AuthShell,
  CheckboxField,
  ConsentCheckbox,
  FooterPrompt,
  IntroBlock,
  PasswordStrengthMeter,
  PrimaryAction,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Platform, type TextInput, View } from "react-native";
import { AuthEmailField, AuthPasswordField } from "@/components/auth/fields";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthFields } from "@/components/auth/hooks/use-auth-fields";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { readKeepSignedIn, saveKeepSignedIn } from "@/components/auth/keep-signed-in-preference";
import { validateSignup } from "@/components/auth/validation";

// Versions sent with the consent payload. Backend rejects with
// CONSENT_VERSION_MISMATCH if these don't match the live published
// versions (currently 1.0.0 semver). The live version will come from
// a runtime config endpoint in a later PR (see TODO in v2-plan).
const TOS_VERSION = "1.0.0";
const PRIVACY_VERSION = "1.0.0";

export default function SignUpScreen(): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const { fieldErrors, setFieldErrors, clearError } = useAuthFields();
  const { submitting, run } = useSubmit();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>(undefined);
  // Web-only "remember me" — persisted to the shared preference so it pre-fills
  // the eventual post-verification sign-in (cookie mode). Hidden on native.
  const isWeb = Platform.OS === "web";
  const [rememberMe, setRememberMe] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isWeb) return;
    void readKeepSignedIn().then(setRememberMe);
  }, [isWeb]);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    const payload = {
      email: trimmedEmail,
      password,
      acceptedTosVersion: TOS_VERSION,
      acceptedPrivacyVersion: PRIVACY_VERSION,
    };

    const clientErrors = validateSignup(payload, t);
    const nextConsentError = consent ? undefined : t("auth.consentRequired");
    if (clientErrors || nextConsentError) {
      setFieldErrors(clientErrors ?? {});
      setConsentError(nextConsentError);
      return;
    }

    setFieldErrors({});
    setConsentError(undefined);
    await run(async () => {
      try {
        await signup(payload);
        router.replace({
          pathname: "/(auth)/verify-email",
          params: { email: trimmedEmail },
        });
      } catch (err) {
        handleAuthApiError(err, {
          locale,
          t,
          toast,
          setFieldErrors,
          fallbackKey: "auth.signupFailed",
          payload: { email: trimmedEmail, password },
        });
      }
    });
  }

  return (
    <AuthShell>
      <IntroBlock
        prefix="Create your "
        emphasis="account."
        subtitle="A few details to get you in the door."
      />

      <View style={{ gap: 24 }}>
        <AuthEmailField
          value={email}
          onChangeText={(next) => {
            setEmail(next);
            clearError("email");
          }}
          error={fieldErrors.email}
          testID="signup.email"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <AuthPasswordField
          inputRef={passwordRef}
          value={password}
          onChangeText={(next) => {
            setPassword(next);
            clearError("password");
          }}
          error={fieldErrors.password}
          testID="signup.password"
          returnKeyType="next"
          isNew
        >
          <PasswordStrengthMeter password={password} />
        </AuthPasswordField>

        <ConsentCheckbox
          checked={consent}
          onToggle={() => {
            setConsent((v) => !v);
            if (consentError) setConsentError(undefined);
          }}
          intro="I agree to the"
          termsLabel={t("auth.consentTerms")}
          onTermsPress={() =>
            router.push({
              pathname: "/legal-webview",
              params: { kind: "terms", title: t("auth.legalTerms") },
            })
          }
          conjunction="and"
          privacyLabel={t("auth.consentPrivacy")}
          onPrivacyPress={() =>
            router.push({
              pathname: "/legal-webview",
              params: { kind: "privacy", title: t("auth.legalPrivacy") },
            })
          }
          {...(consentError ? { error: consentError } : {})}
          testID="signup.consent"
        />

        {isWeb ? (
          <CheckboxField
            checked={rememberMe}
            onToggle={() =>
              setRememberMe((v) => {
                const next = !v;
                void saveKeepSignedIn(next);
                return next;
              })
            }
            label={t("auth.rememberMe")}
            delay={400}
            testID="signup.rememberMe"
          />
        ) : null}
      </View>

      <View style={{ marginTop: 32 }}>
        <PrimaryAction
          label={t("auth.signUp")}
          loading={submitting}
          onPress={handleSubmit}
          testID="signup.submit"
        />
      </View>

      <FooterPrompt
        prompt={t("auth.haveAccount")}
        linkLabel={t("auth.signInInstead")}
        onPress={() => router.push("/(auth)/sign-in")}
        testID="signup.signInLink"
      />
    </AuthShell>
  );
}
