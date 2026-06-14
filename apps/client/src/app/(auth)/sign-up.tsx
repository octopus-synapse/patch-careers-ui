/**
 * Sign-up screen (D95-D98) — "Editorial Calm" refinement.
 *
 * Single-page form: email + password (with refined 4-segment strength
 * meter + check chips) + consent checkbox with inline Terms / Privacy
 * links. Same chrome (AuthShell + IntroBlock + PrimaryAction) as
 * sign-in for visual continuity.
 *
 * Form: React Hook Form (ADR-0005); the resolver reuses validateSignup
 * (Zod + i18n messages). Consent is a separate gate (not a form field).
 * On success → `/verify-email` with the email param.
 */

import { signup } from "@patch-careers/api-client";
import { exchangeSessionForTokens, login } from "@patch-careers/auth";
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
import { useForm } from "react-hook-form";
import { Platform, type TextInput, View } from "react-native";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { readKeepSignedIn, saveKeepSignedIn } from "@/components/auth/keep-signed-in-preference";
import { passwordMeterLabels } from "@/components/auth/password-meter-labels";
import { type AuthFieldErrors, validateSignup } from "@/components/auth/validation";
import { FormEmailField, FormPasswordField, fieldErrorsResolver } from "@/forms";

// Versions sent with the consent payload. Backend rejects with
// CONSENT_VERSION_MISMATCH if these don't match the live published
// versions (currently 1.0.0 semver).
const TOS_VERSION = "1.0.0";
const PRIVACY_VERSION = "1.0.0";

type SignUpForm = { email: string; password: string };

export default function SignUpScreen(): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const { submitting, run } = useSubmit();

  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>(undefined);
  // Web-only "remember me" — persisted so it pre-fills the post-verification
  // sign-in (cookie mode). Hidden on native.
  const isWeb = Platform.OS === "web";
  const [rememberMe, setRememberMe] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const form = useForm<SignUpForm>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    resolver: fieldErrorsResolver<SignUpForm>((values) =>
      validateSignup(
        {
          email: values.email.trim(),
          password: values.password,
          acceptedTosVersion: TOS_VERSION,
          acceptedPrivacyVersion: PRIVACY_VERSION,
        },
        t,
      ),
    ),
  });
  const password = form.watch("password");

  useEffect(() => {
    if (!isWeb) return;
    void readKeepSignedIn().then(setRememberMe);
  }, [isWeb]);

  function applyFieldErrors(fields: AuthFieldErrors): void {
    for (const key of ["email", "password"] as const) {
      const message = fields[key];
      if (message) form.setError(key, { message });
    }
  }

  const onSubmit = form.handleSubmit(async ({ email, password: pw }) => {
    // Consent is gated separately from field validation (UI checkbox).
    if (!consent) {
      setConsentError(t("auth.consentRequired"));
      return;
    }
    setConsentError(undefined);
    const trimmedEmail = email.trim();
    const payload = {
      email: trimmedEmail,
      password: pw,
      acceptedTosVersion: TOS_VERSION,
      acceptedPrivacyVersion: PRIVACY_VERSION,
    };
    await run(async () => {
      try {
        await signup(payload);
        // Signup only sets an httpOnly cookie, but mobile auth is Bearer-based
        // (preferTokens). Log in to obtain a real session: on mobile, login
        // returns a one-shot sessionExchangeId we swap for a token pair, so the
        // session survives the verify step. Without this, verify-email's
        // finishAuthentication() bootstraps with no token and bounces to
        // sign-in instead of onboarding. Wrapped so a failure still falls back
        // to the prior behavior (user can verify + sign in manually).
        try {
          const result = await login(
            trimmedEmail,
            pw,
            isWeb ? { keepSignedIn: rememberMe } : undefined,
          );
          if (result.sessionExchangeId) {
            await exchangeSessionForTokens(result.sessionExchangeId);
          }
        } catch {
          // Fall through to verify-email regardless.
        }
        router.replace({ pathname: "/(auth)/verify-email", params: { email: trimmedEmail } });
      } catch (err) {
        handleAuthApiError(err, {
          locale,
          t,
          toast,
          setFieldErrors: applyFieldErrors,
          fallbackKey: "auth.signupFailed",
          payload: { email: trimmedEmail, password: pw },
        });
      }
    });
  });

  return (
    <AuthShell showEra={false}>
      <IntroBlock
        prefix={t("app.signUp.heroPrefix")}
        emphasis={t("app.signUp.heroEmphasis")}
        subtitle={t("app.signUp.subtitle")}
        showWordmark={false}
      />

      <View style={{ gap: 24 }}>
        <FormEmailField
          control={form.control}
          name="email"
          testID="signup.email"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <FormPasswordField
          control={form.control}
          name="password"
          inputRef={passwordRef}
          testID="signup.password"
          returnKeyType="next"
          isNew
        >
          <PasswordStrengthMeter password={password} {...passwordMeterLabels(t)} />
        </FormPasswordField>

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
          onPress={onSubmit}
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
