/**
 * Sign-up screen (D95-D98) — "Editorial Calm", the sign-in screen's twin.
 *
 * Same card, same title block, same provider chips, same field rhythm as
 * `sign-in`; the two only diverge where sign-up genuinely needs more — the
 * password strength meter and the consent gate.
 *
 * Form: React Hook Form (ADR-0005); the resolver reuses validateSignup
 * (Zod + i18n messages). Consent is not a form field: "Create account"
 * validates the fields, then opens <ConsentDialog>; accepting there is what
 * actually submits. On success → `/verify-email` with the email param.
 */

import { signup } from "@patch-careers/api-client";
import { exchangeSessionForTokens, login } from "@patch-careers/auth";
import { Text, XStack, YStack } from "@patch-careers/ui";
import {
  AuthCard,
  AuthShell,
  CheckboxField,
  editorialFonts,
  FooterPrompt,
  PasswordStrengthMeter,
  PrimaryAction,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Platform, type TextInput } from "react-native";
import { ConsentDialog } from "@/components/auth/consent-dialog";
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
import { FormEmailField, FormNameField, FormPasswordField, useFieldErrorsForm } from "@/forms";

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

  const [consentOpen, setConsentOpen] = useState(false);
  // Web-only "keep me signed in" — same row/label as sign-in; persisted so it
  // pre-fills the post-verification sign-in (cookie mode). Hidden on native.
  const isWeb = Platform.OS === "web";
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const form = useFieldErrorsForm<SignUpForm>(
    (values) =>
      validateSignup(
        { name: values.name.trim(), email: values.email.trim(), password: values.password },
        t,
      ),
    { defaultValues: { name: "", email: "", password: "" } },
  );
  const password = form.watch("password");

  useEffect(() => {
    if (!isWeb) return;
    void readKeepSignedIn().then(setKeepSignedIn);
  }, [isWeb]);

  function applyFieldErrors(fields: AuthFieldErrors): void {
    for (const key of ["name", "email", "password"] as const) {
      const message = fields[key];
      if (message) form.setError(key, { message });
    }
  }

  // DEV-only: pre-fill the form with a unique email + a valid password, so
  // sign-up testing is one tap. Gated by the same flag as the onboarding
  // test-fill. Stays on the screen (the user taps Sign up, then accepts).
  function fillSignupTest(): void {
    form.setValue("name", "Test User", { shouldValidate: true });
    form.setValue("email", `testuser${Date.now()}@example.com`, { shouldValidate: true });
    form.setValue("password", "TestPass123!", { shouldValidate: true });
  }

  // "Create account" only validates the fields and raises the consent gate;
  // the request is sent from `acceptAndSignup` once the user accepts.
  const onSubmit = form.handleSubmit(() => {
    setConsentOpen(true);
  });

  // Reading a document from the dialog: close it first so the pushed screen
  // isn't hidden under the RN Modal on native. The user re-taps to resume.
  function openLegal(kind: "terms" | "privacy"): void {
    setConsentOpen(false);
    router.push({
      pathname: "/legal-webview",
      params: { kind, title: t(kind === "terms" ? "auth.legalTerms" : "auth.legalPrivacy") },
    });
  }

  async function acceptAndSignup(): Promise<void> {
    const { name, email, password: pw } = form.getValues();
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
          const result = await login(trimmedEmail, pw, isWeb ? { keepSignedIn } : undefined);
          if (result.sessionExchangeId) {
            await exchangeSessionForTokens(result.sessionExchangeId);
          }
        } catch {
          // Fall through to verify-email regardless.
        }
        router.replace({ pathname: "/(auth)/verify-email", params: { email: trimmedEmail } });
      } catch (err) {
        // Back to the form so field errors (e.g. e-mail taken) are visible.
        setConsentOpen(false);
        handleAuthApiError(err, {
          locale,
          t,
          toast,
          setFieldErrors: applyFieldErrors,
          fallbackKey: "auth.signupFailed",
        });
      }
    });
  }

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
        </YStack>

        {/* Web: same quiet row as sign-in — checkbox left-aligned under the
            fields — so the two screens keep one rhythm. Native has none. */}
        {isWeb ? (
          <XStack alignItems="center" marginTop={26}>
            <CheckboxField
              checked={keepSignedIn}
              onToggle={() =>
                setKeepSignedIn((v) => {
                  const next = !v;
                  void saveKeepSignedIn(next);
                  return next;
                })
              }
              label={t("auth.keepSignedIn")}
              delay={300}
              testID="signup.keepSignedIn"
            />
          </XStack>
        ) : null}

        <YStack marginTop={isWeb ? 30 : 26}>
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

      <ConsentDialog
        open={consentOpen}
        onOpenChange={setConsentOpen}
        loading={submitting}
        onAccept={() => void acceptAndSignup()}
        onOpenTerms={() => openLegal("terms")}
        onOpenPrivacy={() => openLegal("privacy")}
        testID="signup.consent"
      />
    </AuthShell>
  );
}
