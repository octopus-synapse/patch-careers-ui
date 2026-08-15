/**
 * Sign-up screen (D95-D98) — "Editorial Calm", the sign-in screen's twin.
 *
 * Same card, same title block, same provider chips, same field rhythm as
 * `sign-in`; the two only diverge where sign-up genuinely needs more — the
 * password strength meter and the consent gate.
 *
 * Form: React Hook Form (ADR-0005); the resolver reuses validateSignup
 * (Zod + i18n messages). Consent is a separate gate (not a form field).
 * On success → `/verify-email` with the email param.
 */

import { signup } from "@patch-careers/api-client";
import { exchangeSessionForTokens, login } from "@patch-careers/auth";
import { Text, XStack, YStack } from "@patch-careers/ui";
import {
  AuthCard,
  AuthShell,
  CheckboxField,
  ConsentCheckbox,
  editorialFonts,
  FooterPrompt,
  PasswordStrengthMeter,
  PrimaryAction,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Platform, type TextInput } from "react-native";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useOAuthSignIn } from "@/components/auth/hooks/use-oauth-sign-in";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { readKeepSignedIn, saveKeepSignedIn } from "@/components/auth/keep-signed-in-preference";
import { OAuthBrandButton } from "@/components/auth/oauth-brand-button";
import { GithubGlyph, GoogleGlyph, LinkedinGlyph } from "@/components/auth/oauth-glyphs";
import { passwordMeterLabels } from "@/components/auth/password-meter-labels";
import { type AuthFieldErrors, validateSignup } from "@/components/auth/validation";
import { isDevTestFillEnabled } from "@/config/dev-flags";
import { FormEmailField, FormNameField, FormPasswordField, fieldErrorsResolver } from "@/forms";

// Versions sent with the consent payload. Backend rejects with
// CONSENT_VERSION_MISMATCH if these don't match the live published
// versions (currently 1.0.0 semver).
const TOS_VERSION = "1.0.0";
const PRIVACY_VERSION = "1.0.0";

type SignUpForm = { name: string; email: string; password: string };

export default function SignUpScreen(): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const { handleOAuth } = useOAuthSignIn();
  const { submitting, run } = useSubmit();

  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>(undefined);
  // Web-only "remember me" — persisted so it pre-fills the post-verification
  // sign-in (cookie mode). Hidden on native.
  const isWeb = Platform.OS === "web";
  const [rememberMe, setRememberMe] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const form = useForm<SignUpForm>({
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
    resolver: fieldErrorsResolver<SignUpForm>((values) =>
      validateSignup(
        {
          name: values.name.trim(),
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
    for (const key of ["name", "email", "password"] as const) {
      const message = fields[key];
      if (message) form.setError(key, { message });
    }
  }

  // DEV-only: pre-fill the form with a unique email + a valid password and
  // accept consent, so sign-up testing is one tap. Gated by the same flag as
  // the onboarding test-fill. Stays on the screen (the user taps Sign up).
  function fillSignupTest(): void {
    form.setValue("name", "Test User", { shouldValidate: true });
    form.setValue("email", `testuser${Date.now()}@example.com`, { shouldValidate: true });
    form.setValue("password", "TestPass123!", { shouldValidate: true });
    setConsent(true);
    setConsentError(undefined);
  }

  const onSubmit = form.handleSubmit(async ({ name, email, password: pw }) => {
    // Consent is gated separately from field validation (UI checkbox).
    if (!consent) {
      setConsentError(t("auth.consentRequired"));
      return;
    }
    setConsentError(undefined);
    const trimmedEmail = email.trim();
    const payload = {
      name: name.trim(),
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
    <AuthShell variant="card">
      <AuthCard>
        {/* Deliberately the same shape as sign-in — same title block, same chip
            row, same field rhythm — so the two screens read as one surface. The
            extras (strength meter, consent gate) are what sign-up genuinely
            needs on top. */}
        <Text
          textAlign="center"
          fontFamily={editorialFonts.sans}
          fontSize={28}
          lineHeight={34}
          fontWeight="600"
          letterSpacing={-0.4}
          color="$ink"
        >
          {t("auth.signUp")}
        </Text>

        <XStack justifyContent="center" gap={12} marginTop={22} marginBottom={30}>
          <OAuthBrandButton
            provider="google"
            glyph={GoogleGlyph}
            delay={180}
            label={t("auth.continueWith", { provider: "Google" })}
            onPress={() => handleOAuth("google")}
            testID="signup.google"
          />
          <OAuthBrandButton
            provider="linkedin"
            glyph={LinkedinGlyph}
            delay={240}
            label={t("auth.continueWith", { provider: "LinkedIn" })}
            onPress={() => handleOAuth("linkedin")}
            testID="signup.linkedin"
          />
          <OAuthBrandButton
            provider="github"
            glyph={GithubGlyph}
            delay={300}
            label={t("auth.continueWith", { provider: "GitHub" })}
            onPress={() => handleOAuth("github")}
            testID="signup.github"
          />
        </XStack>

        {isDevTestFillEnabled() ? (
          <YStack alignItems="flex-end" marginBottom={2}>
            <Text
              onPress={fillSignupTest}
              accessibilityRole="button"
              cursor="pointer"
              fontFamily={editorialFonts.mono}
              fontSize={10}
              letterSpacing={1.4}
              color="$inkSubtle"
              paddingVertical={4}
              paddingHorizontal={6}
              testID="signup.devFill"
            >
              test
            </Text>
          </YStack>
        ) : null}

        <YStack gap={24}>
          <FormNameField
            control={form.control}
            name="name"
            testID="signup.name"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <FormEmailField
            control={form.control}
            name="email"
            testID="signup.email"
            inputRef={emailRef}
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
            intro={t("auth.consentIntro")}
            termsLabel={t("auth.consentTerms")}
            onTermsPress={() =>
              router.push({
                pathname: "/legal-webview",
                params: { kind: "terms", title: t("auth.legalTerms") },
              })
            }
            conjunction={t("auth.consentAnd")}
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
        </YStack>

        {isWeb ? (
          <YStack alignItems="center" marginTop={20}>
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
          </YStack>
        ) : null}

        <YStack marginTop={26}>
          <PrimaryAction
            label={t("auth.signUp")}
            loading={submitting}
            onPress={onSubmit}
            testID="signup.submit"
          />
        </YStack>

        <FooterPrompt
          prompt={t("auth.haveAccount")}
          linkLabel={t("auth.signInInstead")}
          onPress={() => router.push("/(auth)/sign-in")}
          testID="signup.signInLink"
        />
      </AuthCard>
    </AuthShell>
  );
}
